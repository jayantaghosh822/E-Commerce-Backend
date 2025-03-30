const mongoose = require('mongoose');

const ProductImagesSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    mainImage: { type: String, required: true }, // Store image URL as a string
    galleryImages: [{ type: String }] // Array of image URLs
});

const ProductImages = mongoose.model('ProductImages', ProductImagesSchema);

module.exports = { ProductImages };
