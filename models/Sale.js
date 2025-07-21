const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  vehicalNo: { type: String },
  name: { type: String },
  salesUser: { type: String, required: true },
  date: { type: Date, default: Date.now },
  billNo: { type: String, required: true, unique: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      price: { type: Number, required: true },
      costPrice: { type: Number, required: true }, // Added cost price for each product
      profit: { type: Number, required: true } // Added profit for each product
    }
  ],
  totalProfit: { type: Number, required: true } // Store total profit for the sale
});

module.exports = mongoose.model('Sale', saleSchema);
