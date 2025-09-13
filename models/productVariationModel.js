const mongoose = require('mongoose');
const variationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    attributes: {
      type: Map,
      of: String,
      required: true,
      get: v => v instanceof Map ? Object.fromEntries(v) : v  // 👈 convert Map → plain object
    },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    images: [String] // variation-specific images
  },
  { timestamps: true }
);
// variationSchema.set('toJSON', { getters: true });
// variationSchema.set('toObject', { getters: true });

const ProductVariation = mongoose.model('ProductVariation',variationSchema);

module.exports = { ProductVariation };

