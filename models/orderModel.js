const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({

  
});

const shippingAddressSchema = new mongoose.Schema({
  name: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
});

const orderSchema = new mongoose.Schema(
  {
    stripeSessionId:{ type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items: {
      type: Object,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    shippingCost:{
      type: Number,
      required: true,
    },
    totalAmount:{
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    paymentMethod: {
      type: String,
      enum: ['cod', 'stripe', 'paypal', 'razorpay'],
      required: true,
    },

    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },

    shippingAddress: shippingAddressSchema,

    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = { Order };
