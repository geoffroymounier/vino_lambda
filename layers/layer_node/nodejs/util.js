const AWS = require('aws-sdk')
const request = require('request')


const generateResponse = (payload, status = 200) => {
  return {
    "statusCode": status,
    "headers": {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    "body": JSON.stringify(payload),
    "isBase64Encoded": false
  }
}


module.exports = {
  generateResponse
}
