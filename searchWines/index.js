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
    useFindAndModify:false,
    useNewUrlParser: true,
    autoIndex:false,
    replicaSet:"Cluster0-shard-0",
    ssl: true,
    sslValidate: true,
  });
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
          cepage:[String],
          vue:[String],
      },
      {timestamps:true})
    ));
    Wine = conn.model('Wine');
  } else {
    console.log('cached')
  }
  const {wineId} = event.pathParameters || {}
  const userId = event.requestContext.authorizer.claims.email
  const {keyOrder,order,limit,minYear,minPrice,maxPrice, maxYear,minApogee,maxApogee,color,cuisine_monde,favorite,stock,nez,legumes,viandes,poissons,desserts,aperitif,fromages,bouche,appelation,domain,region,country,pastilles} = event.queryStringParameters || {}
  const and = [
    wineId ?  {wineId} : {},
    {cellarId : "5d20650b51531fcceabd73ba"} ,//{'$in' : req.cellars}}, // userId vaut saut req.params.uid , soit token.decoded.userId
    minYear ? {annee : {'$gte' : parseInt(minYear)}} : {},
    maxYear ? {annee : {'$lte' : parseInt(maxYear)}} : {},
    minPrice ? {price : {'$gte' : parseInt(minPrice)}} : {},
    maxPrice ? {price : {'$lte' : parseInt(maxPrice)}} : {},
    minApogee ? {apogee : {'$gte' : parseInt(minApogee)}} : {},
    maxApogee ? {apogee : {'$lte' : parseInt(maxApogee)}} : {},
    favorite ? {favorite} : {},
    stock ? {stock : {'$gte' : 0}} : {},
    color ? {color : {'$in' : color.split(',')}} : {},
    domain ? {domain : new RegExp(domain, "gi")} : {},
    region ? {region : new RegExp(region, "gi")} : {},
    country ? {country : new RegExp(country, "gi")} : {},
    appelation ? {appelation : new RegExp(appelation, "gi")} : {},
    cuisine_monde ? {cuisine_monde : {'$in' : cuisine_monde.split(',')}} : {},
    viandes ? {viandes : {'$in' : viandes.split(',')}} : {},
    poissons ? {poissons : {'$in' : poissons.split(',')}} : {},
    desserts ? {desserts : {'$in' : desserts.split(',')}} : {},
    fromages ? {fromages : {'$in' : fromages.split(',')}} : {},
    aperitif ? {aperitif : {'$in' : aperitif.split(',')}} : {}
  ]
  const lim = !isNaN(limit) ? parseInt(limit) : 10
  const sort = { [keyOrder||'region']: order || 1 }

  try {
    const wines = await Wine.find(
      {'$and' : and }).sort( { [keyOrder||'region']: parseInt(order) || 1 } ).limit(lim)
      callback(null, {
              statusCode: 200,
              body: JSON.stringify(wines),
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
