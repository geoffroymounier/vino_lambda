const AWS = require('aws-sdk');
const csvtojson = require('csvtojson');
const mongoose = require('mongoose');
const { generateResponse, createConnection, removeAccents } = require('/opt/nodejs/util');
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
  if (/_UPDATED\.csv$/.test(srcKey)) {
    generateResponse(callback,{message:'Replaced CSV should not call function.'});
    return;
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
    }).fromStream(stream);

    let bulkWrites = [];

    for (var entry of csvFile) {

      const docData = Object.keys(entry).reduce((json,e) =>
        /\n/.test(entry[e]) ? {...json, [e] : entry[e].split('\n')}
        : {...json,[e]:entry[e]}
      ,{});

      bulkWrites.push(
      { "updateOne" :
        {
           "filter": {_id : entry._id || new mongoose.Types.ObjectId()},
           "update": {...docData,text:removeAccents(`${docData.domain || ''} ${docData.appelation} ${docData.region}`)},
           "upsert": true,
        }
      });
      }

      await AdminWineModel.bulkWrite(bulkWrites);

      const wines = await AdminWineModel.find({});
      const header = Object.keys(wines[0].toJSON()).map(_ => JSON.stringify(_)).join(';') + '\n';
      const replacedData = wines.reduce((acc, row) => {
        return acc + Object.values(row.toJSON()).map(_ =>
          Array.isArray(_) ?  "\"" + (_.join("\n")) + "\"" : JSON.stringify(_)
        ).join(';') + '\n';
      }, header);


      await s3.deleteObject({...params,Key:srcKey}).promise();
      await s3.putObject({...params,Key:`${srcKey.replace(/\.csv$/,'_UPDATED.csv')}`,Body:replacedData}).promise();
      generateResponse(callback,{message:wines.length + ' wine(s) successfully uploaded.'});



  } catch (err){
    console.log({err});
    generateResponse(callback,{Error: err,Reference: context.awsRequestId},500);
  }
};
