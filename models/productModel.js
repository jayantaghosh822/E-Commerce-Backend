const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema(
    {
   name:{
    type:String,
    //required:true,
   },
   slug:{
    type:String,
    //required:true,
   // unique:true,
   },
   description:{
    type:String,
    //required:true,
   },
    price:{
        type:Number,
        //required:true,
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        //required:true,
    },
    quan:{
        type:Number,
        //required:true,
    },
    photo:{
        data:Buffer,
        contentType:String,
    },
    shipping:{
        type:Boolean,
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand", // reference to Brand model
        required: true,
    }
},
{timestamps:true}
);
const Product = mongoose.model('Product',ProductSchema);

module.exports = { Product };