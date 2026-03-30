const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Gamification = require('../models/Gamification');
const logger = require('../utils/logger');

// Validate JWT_SECRET at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Generate JWT Token
const generateToken = (id) => {
  const secret = JWT_SECRET || 'development_secret_only';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone
    });

    // Create gamification profile (optional - don't block registration if it fails)
    try {
      await Gamification.create({
        userId: user._id
      });
    } catch (gamificationError) {
      logger.warn('Gamification profile creation failed:', gamificationError.message);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level
      }
    });
  } catch (error) {
    logger.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        avatar: user.avatar,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const gamification = await Gamification.findOne({ userId: req.user.id });

    res.json({
      success: true,
      user,
      gamification
    });
  } catch (error) {
    logger.error('Get user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, darkMode, notifications, location } = req.body;

    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (darkMode !== undefined) user.darkMode = darkMode;
    if (notifications) user.notifications = { ...user.notifications, ...notifications };
    if (location) user.location = location;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        darkMode: user.darkMode,
        notifications: user.notifications
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};
