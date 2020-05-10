const mongoose = require('mongoose');
const { generateResponse, createConnection } = require('/opt/nodejs/util');
const {DBUSER,DBPASS,DBCLUSTER} =  process.env;

const {AdminWineSchema} = require('./adminWineSchema.js');

let conn = null;
let AdminWineModel = null;

exports.handler = async (event, context,callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const {queryStringParameters = {}} = event;
  const {search = ''} = queryStringParameters;
  // connect to DB
  if (conn == null) {
    conn = await createConnection({DBUSER,DBPASS,DBCLUSTER});
    AdminWineModel = conn.model('Admin-Wine', new mongoose.Schema(AdminWineSchema));
  } else {
    console.log('cached');
  }


  try {
    const wines = await AdminWineModel.find(
      {text : new RegExp(search, "gi")}
    );
    generateResponse(callback,wines);

  } catch (err){
    console.log({err});
    generateResponse(callback,{Error: err,Reference: context.awsRequestId},500);
  }
};
