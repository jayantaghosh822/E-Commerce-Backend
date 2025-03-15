const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // reference to another Category document
    default: null,    // root categories can have no parent
  },
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = { Category };
