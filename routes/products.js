const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Category = require('../models/Category');
const Sale = require('../models/Sale');

const router = express.Router();

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Get products with search and filter
router.get('/', auth(), async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (admin only, with image upload)
router.post('/', auth('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, costPrice, stock, productCode } = req.body;
    let image = '';
    if (req.file) {
      image = '/uploads/products/' + req.file.filename;
    }
    const product = new Product({ name, category, price, costPrice, stock, image, productCode });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit product (admin only)
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const { name, category, price, costPrice, stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, costPrice, stock },
      { new: true }
    );
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all categories (distinct)
router.get('/categories', auth(), async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new category (admin only)
router.post('/categories', auth('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name required' });
    let existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Category already exists' });
    const category = new Category({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a sale (admin, manager, or user)
router.post('/sales', auth(), async (req, res) => {
  try {
    const { vehicalNo, name, salesUser, billNo, products } = req.body;
    if (!salesUser || !billNo || !products || !Array.isArray(products) || products.length === 0) {
    console.log(!salesUser, !billNo, !products, !Array.isArray(products), products.length === 0);
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Calculate profit for each product and total profit
    let totalProfit = 0;
    const productsWithProfit = [];
    for (const item of products) {
      const prod = await Product.findById(item.productId);
      if (!prod) return res.status(404).json({ message: `Product not found: ${item.productId}` });
      if (prod.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${prod.name}` });
      prod.stock -= item.quantity;
      await prod.save();
      const costPrice = prod.costPrice;
      const profit = (item.price - (costPrice * item.quantity)) - (item.discount || 0);
      totalProfit += profit;
      productsWithProfit.push({
        ...item,
        costPrice,
        profit
      });
    }
    const sale = new Sale({ vehicalNo, name, salesUser, billNo, products: productsWithProfit, totalProfit });
    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    console.error('Error creating sale:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sales (admin/manager: all, user: only their own)
router.get('/sales', auth(), async (req, res) => {
  try {
    const { user, date, billNo, vehicalNo } = req.query;
    const query = {};
    if (req.user.role === 'user') {
      query.salesUser = req.user.username;
    } else {
      if (user) query.salesUser = user;
    }
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (billNo) query.billNo = billNo;
    if (vehicalNo) query.vehicalNo = vehicalNo;
    const sales = await Sale.find(query).sort({ date: -1 });
    
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales report (admin/manager only)
router.get('/sales/report', auth(['admin', 'manager']), async (req, res) => {
  try {
    const { from, to, user, month } = req.query;
    const query = {};
    if (user) query.salesUser = user;
    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    } else if (month) {
      // month format: YYYY-MM
      const [year, m] = month.split('-');
      const firstDay = new Date(Number(year), Number(m) - 1, 1);
      const lastDay = new Date(Number(year), Number(m), 0, 23, 59, 59, 999);
      query.date = { $gte: firstDay, $lte: lastDay };
    }
    const sales = await Sale.find(query);
    const totalProfit = sales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
    res.json({ sales, totalProfit });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
