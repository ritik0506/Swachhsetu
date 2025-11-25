const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['toilet', 'waste', 'restaurant', 'beach', 'street', 'park', 'water', 'other'],
    required: [true, 'Category is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 1000
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]
    },
    address: {
      type: String,
      default: ''
    },
    landmark: String
  },
  images: [{
    url: String,
    uploadedAt: Date
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected', 'verified'],
    default: 'pending'
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  aiAnalysis: {
    cleanlinessScore: Number,
    suggestedCategory: String,
    urgencyLevel: String,
    tags: [String],
    confidence: Number,
    // New AI triage fields
    triageCompleted: {
      type: Boolean,
      default: false
    },
    triageTimestamp: Date,
    refinedCategory: {
      type: String,
      enum: ['toilet', 'waste', 'restaurant', 'beach', 'street', 'park', 'water', 'drainage', 'other']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    priority: {
      type: Number,
      min: 1,
      max: 5
    },
    suggestedTitle: String,
    recommendedAction: {
      type: String,
      enum: ['create_ticket', 'notify_inspector', 'escalate', 'requires_review', 'ignore']
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1
    },
    rationale: String,
    aiTags: [String],
    requiresImmediateAttention: Boolean,
    estimatedResolutionTime: String,
    language: {
      code: String,
      name: String,
      confidence: Number
    }
  },
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  estimatedResolutionTime: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
