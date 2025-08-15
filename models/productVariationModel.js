const mongoose = require('mongoose');
const variationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    attributes: {
      type: Map,
      of: String,
      required: true
    },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    images: [String] // variation-specific images
  },
  { timestamps: true }
);

const ProductVariation = mongoose.model('ProductVariation',variationSchema);

module.exports = { ProductVariation };

