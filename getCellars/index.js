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

  const queryParams = {
    TableName: 'Cellars',
    // TODO: Turn this into an env var
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": event.requestContext.authorizer.claims.email,
    }
  }
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
