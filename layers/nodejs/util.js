const mongoose = require('mongoose')

const generateResponse = (callback,payload, status = 200) => {
  callback(null, {
    "statusCode": status,
    "headers": {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    "body": JSON.stringify(payload),
    "isBase64Encoded": false
  })
}

const createConnection = async ({DBUSER,DBPASS,DBCLUSTER}) => {
  const connnectString =  "mongodb+srv://"+DBUSER+":"+DBPASS+"@"+DBCLUSTER+".mongodb.net/test"
  const connection = await mongoose.createConnection(connnectString, {
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0, // and MongoDB driver buffering
    useFindAndModify:false,
    useNewUrlParser: true,
    autoIndex:false,
    replicaSet:"Cluster0-shard-0",
    ssl: true,
    sslValidate: true,
  });
  return connection
}

module.exports = {
  generateResponse,
  createConnection
}
