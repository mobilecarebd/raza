const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads/products', express.static(path.join(__dirname, '../uploads/products')));

app.use('/api/test', require('../routes/test'));
app.use('/api/auth', require('../routes/auth'));
app.use('/api/products', require('../routes/products'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/razafilling';

let conn = null;
async function connectDB() {
  if (!conn) {
    conn = mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await conn;
  }
}

module.exports = async (req, res) => {
  await connectDB();
  app(req, res);
};
