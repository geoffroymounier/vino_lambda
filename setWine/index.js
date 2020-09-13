const { generateResponse, createConnection } = require('/opt/nodejs/util');
const { DBUSER, DBPASS, DBCLUSTER } = process.env;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {ObjectId} = mongoose.Types;

let conn = null;
let Wine = null;


exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (conn == null) {
    conn = await createConnection({ DBUSER, DBPASS, DBCLUSTER });
    conn.model('Wine', new mongoose.Schema(new Schema(
      {
        userId: { type: String, required: true },
        cellarId: { type: ObjectId },
        stock: Number,
        favorite: Boolean,
        appelation: String,
        domain: String,
        temperature: String,
        photo: { type: Buffer, contentType: String },
        annee: { type: Number, min: 1900, max: 2050 },
        before: { type: Number, min: 1900, max: 2050 },
        apogee: { type: Number, min: 1900, max: 2050 },
        carafage: String,
        typologie: String,
        country: String,
        region: String,
        color: String,
        commentaire: String,
        price: { type: Number, min: 0, max: 10000 },
        vendor: String,
        legumes: [String], viandes: [String], poissons: [String], desserts: [String], aperitif: [String], fromages: [String], cuisine_monde: [String],
        bouche: [String],
        pastilles: [String],
        accords: [String],
        cepage: [String],
        vue: [String],
      },
      { timestamps: true })
    ));
    Wine = conn.model('Wine');
    console.log('connected');
  } else {
    console.log('cached');
  }
  const wine = JSON.parse(event.body || '{}');
  const { wineId } = event.pathParameters || {};
  const userId = event.requestContext.authorizer.claims.email;
  const _id = wineId === 'new' ? new ObjectId() : wineId;
  
  const updatedWine = {
    ...wine,
    userId,
  };
  try {
    let doc = await Wine
      .findOneAndUpdate({ _id, userId }, { ...updatedWine }, { upsert: true, new: true })
      .select('_id cellarId stock favorite appelation domain annee country region color price moment');

    generateResponse(callback, doc);

  } catch (err) {
    generateResponse(callback, { Error: err, Reference: context.awsRequestId }, 500);
  }
};
