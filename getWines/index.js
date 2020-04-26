const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();


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
  if (!event.requestContext.authorizer) {
    errorResponse('Authorization not configured', context.awsRequestId, callback);
    return;
  }
  const {cellarId,wineId} = event.pathParameters || {}

  const queryParams = {
    TableName: 'Wines',
    // TODO: Turn this into an env var
    KeyConditionExpression: `userId = :userId ${cellarId ? "AND cellarId = :cellarId" : ""} ${wineId ? "AND wineId = :wineId" : ""}`,
    ExpressionAttributeValues: {
      ":cellarId": cellarId,
      ":userId": event.requestContext.authorizer.claims.email,
      ":wineId": wineId,
    }
  }
  console.log(queryParams)
  try {
    const cellars = await ddb.query(queryParams).promise()
    callback(null, {
            statusCode: 200,
            body: JSON.stringify(cellars.Items),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
  } catch (e) {
    errorResponse(e, context.awsRequestId, callback);
    return;
  }
}
