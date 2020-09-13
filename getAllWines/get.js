// const mongoose = require('mongoose');
const { generateResponse, createConnection } = require('/opt/nodejs/util')
const {DBUSER,DBPASS,DBCLUSTER} =  process.env
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

let conn = null;
let Wine = null;


exports.handler = async (event, context,callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  if (conn == null) {
    conn = await createConnection({DBUSER,DBPASS,DBCLUSTER});
    conn.model('Wine', new mongoose.Schema(new Schema(
      {
          cellarId: {type:ObjectId,required:true},
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
          cepage:[{color:String,name:String,share:Number}],
          vue:[String]
      },
      {timestamps:true})
    ));
    Wine = conn.model('Wine');
  } else {
    console.log('cached')
  }
  const {wineId} = event.pathParameters || {}
  const userId = event.requestContext.authorizer.claims.email
  const {keyOrder,order,limit,mostRecentUpdate,cellarId} = event.queryStringParameters || {}
  const and = [
    {userId},
    wineId ?  {_id : wineId} : {},
    mostRecentUpdate ? {updatedAt : {'$gte':mostRecentUpdate }} : {},
    cellarId ? {cellarId} : {} ,//{'$in' : req.cellars}}, // userId vaut saut req.params.uid , soit token.decoded.userId
  ]

  try {
    const wines = !!wineId
    ? await Wine.find({'$and' : and })
    : await Wine
      .find({'$and' : and })
      .select('_id cellarId stock favorite appelation domain annee country region color price moment');

    generateResponse(callback,{wines,mostRecentUpdate:Date.now()})
  } catch(err) {
    generateResponse(callback,{Error: err,Reference: context.awsRequestId},500)
  }

    // })
    // .catch((err) => {
    //   console.log(err)
    //   errorResponse(err, context.awsRequestId, callback)
    // })
}
