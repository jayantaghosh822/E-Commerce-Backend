const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        variationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductVariation', // assuming you have a Variation model
          required: true,
        },
        quan: {
          type: Number,
          required: true,
          min: 1,
        },
        metaData: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', CartSchema);

module.exports = { Cart };
