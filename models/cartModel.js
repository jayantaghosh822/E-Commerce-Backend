const mongoose = require('mongoose');
const CartSchema = new mongoose.Schema(
    {
    product:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' ,
        required:true,
    },
    userId:{
        type:String,
        // required:true,
    },
    metaData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
   quan:{
    type:Number,
    required:true,
   },
   
  
}

);
const Cart = mongoose.model('Cart',CartSchema);

module.exports = { Cart };