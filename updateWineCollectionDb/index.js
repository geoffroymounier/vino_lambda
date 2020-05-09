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
    // connect to Bucket

  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const params = {
    Bucket: srcBucket,
    Key: srcKey
  };
  if (/^REPLACE_/.test(srcKey)) {
    generateResponse(callback,{message:'Replaced CSV should not call function.'});
    return
  }

  // connect to DB
  if (conn == null) {
    conn = await createConnection({DBUSER,DBPASS,DBCLUSTER});
    AdminWineModel = conn.model('Admin-Wine', new mongoose.Schema(AdminWineSchema));
  } else {
    console.log('cached');
  }



  try {
    const stream = await s3.getObject(params).createReadStream();
    const csvFile = await csvtojson({
      delimiter:";"
    }).fromStream(stream)
    let wines = []

    for (var entry of csvFile) {
      const wine =  await AdminWineModel.findOneAndUpdate(
        {_id : entry._id || new mongoose.Types.ObjectId()} ,
        {...entry},{new: true,upsert:true}
      )
      wines.push(wine)
    }

      // const adminWine = new AdminWineModel();

      const header = Object.keys(wines[0].toJSON()).map(_ => JSON.stringify(_)).join(';') + '\n'
      const replacedData = wines.reduce((acc, row) => {
        return acc + Object.values(row.toJSON()).map(_ => JSON.stringify(_)).join(';') + '\n'
      }, header)
      const s3Response = await s3.putObject({...params,Key:`REPLACE_${srcKey}`,Body:replacedData}).promise();
      generateResponse(callback,{message:wines.length + ' wine(s) successfully uploaded.'});



  } catch (err){
    console.log({err});
    generateResponse(callback,{Error: err,Reference: context.awsRequestId},500);
  }
};
