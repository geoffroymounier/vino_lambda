// const mongoose = require('mongoose');
const csv = require('fast-csv');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dbUser =  process.env.DBUSER || null
const dbPass = process.env.DBPASS || null
const dbCluster = process.env.DBCLUSTER || null
const mongoose = require('mongoose')
const AdminWineSchema = require('./adminWineSchema.js')
const connnectString =  "mongodb+srv://"+dbUser+":"+dbPass+"@"+dbCluster+".mongodb.net/test"

let conn = null;
let AdminWine = null;
function errorResponse(errorMessage, awsRequestId, callback) {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

exports.handler = async (event, context,callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const params = {
    Bucket: srcBucket,
    Key: srcKey
  };

  if (conn == null) {
    conn = await mongoose.createConnection(connnectString, {
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // and MongoDB driver buffering
      useFindAndModify:false,
      useNewUrlParser: true,
      autoIndex:false,
      replicaSet:"Cluster0-shard-0",
      ssl: true,
      sslValidate: true,
    });
    conn.model('Admin-Wine', new mongoose.Schema(AdminWineSchema));
    AdminWine = conn.model('Admin-Wine');
  } else {
    console.log('cached')
  }


  const csvFile = await s3.getObject(params).promise();

  var adminWines = []
  console.log(csvFile)
  try {

    csv.fromString(csvFile.data.toString(), {
         headers: true,
         ignoreEmpty: true
     })
     .on("data", function(data){
         data['_id'] = data['_id'] || new mongoose.Types.ObjectId();
         adminWines.push(data);
     })
     .on("end", function(){
         AdminWine.save(adminWines, function(err, documents) {
            if (err) throw err;
         });

         res.send(adminWines.length + ' wine have been successfully uploaded.');
     });

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({wines,mostRecentUpdate:Date.now()}),
      headers: {
          'Access-Control-Allow-Origin': '*',
      },
    });
  } catch(err) {
    errorResponse(err, context.awsRequestId, callback)
  }

    // })
    // .catch((err) => {
    //   console.log(err)
    //   errorResponse(err, context.awsRequestId, callback)
    // })
}
