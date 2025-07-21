require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files for product images
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products')));

// Example route
const testRouter = require('./routes/test');
app.use('/api/test', testRouter);

// Auth & user management routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Product routes
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/razafilling';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
