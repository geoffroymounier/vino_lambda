const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const { v4: uid } = require('uuid');

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

exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  const wine = JSON.parse(event.body || '{}')
  const {wineId} = event.queryStringParameters || {}
  if (!event.requestContext.authorizer) {
    errorResponse('Authorization not configured', context.awsRequestId, callback);
    return;
  }
  var addParams = {
    TableName:'Wines',
    Item:{
      ...wine,
      "wineId": wine.wineId || uid(),
      "userId": event.requestContext.authorizer.claims.email,
      "cellarId": wine.cellarId || uid(),
      "added":Date.now()
  }
};
console.log(addParams)
  try {
    const wine = await ddb.put(addParams).promise()
    callback(null, {
            statusCode: 200,
            body: JSON.stringify(wine),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
  } catch (e) {
    console.log({e})
    errorResponse(e, context.awsRequestId, callback);
    return;
  }
}
