const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

module.exports = {
  AdminWineSchema : new Schema(
    {
        appelation: String,
        appelationType: String,
        classification : String,
        color:[String],
        country:String,
        domain: String,
        photo:String,
        region:String,
        temperature: String,
        typologie : String
    },
    {timestamps:true}
  )
}
