const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true }, // Added cost price for profit calculation
  stock: { type: Number, default: 0 },
  image: { type: String }, // URL or path to image
  productCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
