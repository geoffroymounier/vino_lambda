const AWS = require('aws-sdk');
const csvtojson = require('csvtojson');
const mongoose = require('mongoose');
const { generateResponse, createConnection } = require('/opt/nodejs/util');
const {DBUSER,DBPASS,DBCLUSTER} =  process.env;
const s3 = new AWS.S3();

const {AdminWineSchema} = require('./adminWineSchema.js');

let conn = null;
let AdminWineModel = null;

exports.handler = async (event, context,callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // connect to DB
  if (conn == null) {
    conn = await createConnection({DBUSER,DBPASS,DBCLUSTER});
    AdminWineModel = conn.model('Admin-Wine', new mongoose.Schema(AdminWineSchema));
  } else {
    console.log('cached');
  }

  // connect to Bucket
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const params = {
    Bucket: srcBucket,
    Key: srcKey
  };

  try {
    const stream = await s3.getObject(params).createReadStream();
    const entries = (await csvtojson().fromStream(stream)).reduce((arr,entry) =>
      [...arr,{
        _id : entry._id || new mongoose.Types.ObjectId(),
        ...entry
      }],[]);
      // const adminWine = new AdminWineModel();
      const wines = (await AdminWineModel.insertMany(entries));

      const header = Object.keys(wines[0].toJSON()).map(_ => JSON.stringify(_)).join(';') + '\n'
      const replacedData = wines.reduce((acc, row) =>
         acc + Object.values(row.toJSON()).map(_ => JSON.stringify(_)).join(';') + '\n'
      , header)

      const s3Response = await s3.putObject({...params,Body:replacedData}).promise();
      generateResponse(callback,{message:entries.length + ' wine(s) successfully uploaded.'});



  } catch (err){
    console.log({err});
    generateResponse(callback,{Error: err,Reference: context.awsRequestId},500);
  }
};
