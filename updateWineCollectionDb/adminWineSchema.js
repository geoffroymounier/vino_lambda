const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

module.exports = {
  AdminWineSchema : new Schema(
    {
        photo:String,
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
        vendor:String,
        bouche:[String],
        pastilles:[String],
        accords:[String],
        cepage:[String],
        vue:[String]
    },
    {timestamps:true}
  )
}
