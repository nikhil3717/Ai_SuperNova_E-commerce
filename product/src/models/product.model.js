
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
   title: {
    type:String,
    require:true
   },
   description: {
    type:String,
    require:true
   },
   price: {
      amount:{
         type:Number,
         require:true
      },
      currency: {
         type:String,
         enum:["USD","INR"],
         default:"INR"
       
      }
   },
   seller:{
      type:mongoose.Schema.Types.ObjectId,
      required:true,

   },
   image: [
      {
         url:String,
         thumbnail:String,
         id:String,
      }
   ],
   stock: {
      type:Number,
      default:0
   }


})

 productSchema.index({title: "text",description:"text" })

const Product = mongoose.model("product",productSchema)

module.exports = Product