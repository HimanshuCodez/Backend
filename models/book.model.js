import mongoose from "mongoose";
const bookSchema = new mongoose.Schema({
   url: {
      type: String,
      required: true,
   },
   name: {
      type: String,
      required: true,
   },
   author: {
      type: String,
      required: true,
   },
   description: {
      type: String,
      required: true,
   },
   price: {
      type: Number,
      required: true,
   },
   discountedPrice:{
      type: Number,
      default: 0,
   },
   discountPercent:{
      type:Number,
      default: 0,
   },
   category:{
      type : String,
      required:true,
   },

   language: {
      type: String,
      required: true,
   },
   stock: {
      type: Number,
      required: true,
      default: 10
   },
   quantity: {
      type: Number,
      default: 1,
      required: true
   },
   isbn: { type: String, unique: true },

}, { timestamps: true })
//model
export default mongoose.model("books", bookSchema);
