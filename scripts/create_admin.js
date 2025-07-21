require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/razafilling';

async function createAdmin() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const username = 'admin';
  const password = 'admin123';
  const role = 'admin';
  let user = await User.findOne({ username });
  if (user) {
    console.log('Admin user already exists');
    process.exit(0);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  user = new User({ username, password: hashedPassword, role });
  await user.save();
  console.log('Admin user created:', { username, password, role });
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error creating admin user:', err);
  process.exit(1);
});
