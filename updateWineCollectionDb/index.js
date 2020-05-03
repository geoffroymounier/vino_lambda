const AWS = require('aws-sdk');
const csv = require('csvtojson');
const mongoose = require('mongoose')

const { generateResponse, createConnection } = require('/opt/nodejs/util')
const {DBUSER,DBPASS,DBCLUSTER} =  process.env
const s3 = new AWS.S3();

const {AdminWineSchema} = require('./adminWineSchema.js')

let conn = null;
let AdminWine = null;

exports.handler = async (event, context,callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const params = {
    Bucket: srcBucket,
    Key: srcKey
  };

  if (conn == null) {
    conn = await createConnection({DBUSER,DBPASS,DBCLUSTER});
    conn.model('Admin-Wine', new mongoose.Schema(AdminWineSchema));
    AdminWine = conn.model('Admin-Wine');
  } else {
    console.log('cached')
  }


  const stream = await s3.getObject(params).createReadStream();

  var adminWines = []

  csv().fromStream(stream).on('data', (data) => {
   const json = JSON.parse(new Buffer(data).toString(“utf8”));
   console.log(json)
  })
  // try {
  //
  //   csv.fromString(csvFile.data.toString(), {
  //        headers: true,
  //        ignoreEmpty: true
  //    })
  //    .on("data", function(data){
  //        data['_id'] = data['_id'] || new mongoose.Types.ObjectId();
  //        adminWines.push(data);
  //    })
  //    .on("end", function(){
  //        AdminWine.save(adminWines, function(err, documents) {
  //           if (err) throw err;
  //        });
  //        generateResponse(callback,{message:adminWines.length + ' wine have been successfully uploaded.'})
  //    });
  //
  // } catch(err) {
  //   generateResponse(callback,{Error: err,Reference: context.awsRequestId},500)
  // }

}
