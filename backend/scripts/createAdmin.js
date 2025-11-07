// Script to create an admin user for testing
// Run with: node scripts/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swachhsetu');
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@swachhsetu.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@swachhsetu.com');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@swachhsetu.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+91-1234567890',
      points: 1000,
      level: 10
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@swachhsetu.com');
    console.log('Password: admin123');
    console.log('Role:', admin.role);
    
    // Create a test moderator as well
    const moderatorPassword = await bcrypt.hash('moderator123', salt);
    const moderator = await User.create({
      name: 'Moderator User',
      email: 'moderator@swachhsetu.com',
      password: moderatorPassword,
      role: 'moderator',
      phone: '+91-9876543210',
      points: 500,
      level: 5
    });

    console.log('✅ Moderator user created successfully!');
    console.log('Email: moderator@swachhsetu.com');
    console.log('Password: moderator123');
    console.log('Role:', moderator.role);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
