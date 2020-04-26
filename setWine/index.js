// const mongoose = require('mongoose');
const dbUser =  process.env.DBUSER || null
const dbPass = process.env.DBPASS || null
const dbCluster = process.env.DBCLUSTER || null
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const connnectString =  "mongodb+srv://"+dbUser+":"+dbPass+"@"+dbCluster+".mongodb.net/test"

let conn = null;
let Wine = null;
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

  if (conn == null) {
    conn = await mongoose.createConnection(connnectString, {
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // and MongoDB driver buffering
      // useFindAndModify:false,
      // useNewUrlParser: true,
      // autoIndex:false,
      // replicaSet:"Cluster0-shard-0",
      // ssl: true,
      // sslValidate: true,
    });
    conn.model('Wine', new mongoose.Schema(new Schema(
      {
          userId: {type:String,required:true},
          stock : Number,
          photo:String,
          favorite : Boolean,
          appelation: String,
          domain: String,
          temperature: String,
          photo : { type: Buffer,contentType: String },
          annee : {type:Number,min:1900,max:2050},
          before : {type:Number,min:1900,max:2050},
          apogee : {type:Number,min:1900,max:2050},
          carafage : String,
          typologie : String,
          country:String,
          region:String,
          color:String,
          commentaire:String,
          price:{type:Number,min:0,max:10000},
          vendor:String,
          legumes:[String],viandes:[String],poissons:[String],desserts:[String],aperitif:[String],fromages:[String],cuisine_monde:[String],
          bouche:[String],
          pastilles:[String],
          accords:[String],
          cepage:[String],
          vue:[String],
      },
      {timestamps:true})
    ));
    Wine = conn.model('Wine');
    console.log('connected')
  } else {
    console.log('cached')
  }

  const wine = JSON.parse(event.body || '{}')
  const {wineId} = event.pathParameters || {}
  const userId = event.requestContext.authorizer.claims.email
  try {
    console.log('will find')
    let doc = await Wine.findOne(
      {'$and' : [
        {userId},
        {_id:wineId}
      ]})
    if (!doc) {
      console.log('not found')
      const results = await Wine.create(wine)
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(results),
          headers: {
              'Access-Control-Allow-Origin': '*',
          }
      })
    } else {
      doc = Object.assign(doc,wine)
      const results = await doc.save()
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(results),
          headers: {
              'Access-Control-Allow-Origin': '*',
          },
      });
    }
  } catch (err) {
    errorResponse(err, context.awsRequestId, callback);
  }


}
