const mongoose = require('mongoose');

/**
 * AI Processing Log Model
 * Tracks all AI processing jobs for monitoring and auditing
 */
const aiProcessingLogSchema = new mongoose.Schema({
  // Job identification
  jobType: {
    type: String,
    enum: ['triage-report', 'translate-text', 'generate-followup', 'assign-inspector'],
    required: true,
    index: true
  },
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  
  // References
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  referenceId: String,
  referenceType: String,
  
  // Input data
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Processing result
  result: mongoose.Schema.Types.Mixed,
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'retrying'],
    default: 'pending',
    index: true
  },
  
  // Performance metrics
  processingTime: {
    type: Number,  // milliseconds
    index: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  
  // Error tracking
  error: String,
  errorStack: String,
  
  // AI model info
  modelUsed: String,
  modelVersion: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for efficient queries
aiProcessingLogSchema.index({ createdAt: -1 });
aiProcessingLogSchema.index({ jobType: 1, status: 1 });
aiProcessingLogSchema.index({ reportId: 1, jobType: 1 });

// Static methods
aiProcessingLogSchema.statics.getStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date()
        }
      }
    },
    {
      $group: {
        _id: '$jobType',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        avgProcessingTime: { $avg: '$processingTime' },
        maxProcessingTime: { $max: '$processingTime' },
        minProcessingTime: { $min: '$processingTime' }
      }
    }
  ]);
};

aiProcessingLogSchema.statics.getRecentErrors = async function(limit = 10) {
  return this.find({ status: 'failed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('jobType error createdAt attempts data');
};

module.exports = mongoose.model('AIProcessingLog', aiProcessingLogSchema);
