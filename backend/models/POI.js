const mongoose = require('mongoose');

const poiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['toilet', 'restaurant', 'waste-collection', 'recycling-center', 'park'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  description: String,
  images: [String],
  ratings: {
    cleanliness: { type: Number, default: 0, min: 0, max: 5 },
    accessibility: { type: Number, default: 0, min: 0, max: 5 },
    maintenance: { type: Number, default: 0, min: 0, max: 5 },
    overall: { type: Number, default: 0, min: 0, max: 5 }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  amenities: [String],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For waste collection points
  schedule: [{
    day: String,
    time: String,
    type: String // organic, recyclable, hazardous
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
poiSchema.index({ location: '2dsphere' });
poiSchema.index({ type: 1 });

module.exports = mongoose.model('POI', poiSchema);
