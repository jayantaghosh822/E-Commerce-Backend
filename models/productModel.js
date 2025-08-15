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
       
        category:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Category",
            //required:true,
        },
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
        },
        attributes: [
        {
            name: String, // e.g. size, color
            values: [String] // e.g. ["S", "M", "L"]
        }
        ],
        isActive: { type: Boolean, default: true },
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
