const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // assuming a User model exists
      required: true,
    },
    quan: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number, // optional: snapshot of price at time of adding
    },
    image: {
      type: String, // optional: for UI display
    },
    metaData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', CartSchema);

module.exports = { Cart };
