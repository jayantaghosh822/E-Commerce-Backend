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
    // price:{
    //     type:Number,
    //     //required:true,
    // },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        //required:true,
    },
    size:[{
        size: String,
        quantity: Number,
        price: Number
    }],
    color:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Color",
    },
    image:{
        // data:Buffer,
        // contentType:String,
        type:String,
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

ProductSchema.virtual('images', {
    ref: 'ProductImages',
    localField: '_id',
    foreignField: 'product',
    justOne: true
  });
  
  ProductSchema.set('toObject', { virtuals: true });
  ProductSchema.set('toJSON', { virtuals: true });

const Product = mongoose.model('Product',ProductSchema);

module.exports = { Product };
