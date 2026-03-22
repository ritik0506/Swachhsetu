const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  // Gamification fields
  points: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: Date,
    description: String
  }],
  level: {
    type: Number,
    default: 1
  },
  reportsSubmitted: {
    type: Number,
    default: 0
  },
  reportsResolved: {
    type: Number,
    default: 0
  },
  // Inspector-specific fields (FR-4 enhancements)
  shiftStatus: {
    type: Boolean,
    default: false,
    comment: 'Whether inspector is currently on shift'
  },
  vehicleType: {
    type: String,
    enum: ['None', 'Bike', 'Car', 'Truck', 'Van', 'Heavy Equipment'],
    default: 'None',
    comment: 'Vehicle type available to inspector'
  },
  availabilityCalendar: [{
    date: { type: Date, required: true },
    shiftStart: { type: String }, // e.g., "09:00"
    shiftEnd: { type: String },   // e.g., "17:00"
    isAvailable: { type: Boolean, default: true },
    notes: String
  }],
  // User preferences
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
