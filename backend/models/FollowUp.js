const mongoose = require('mongoose');

/**
 * Follow-up Model
 * Tracks scheduled and sent follow-up messages
 */
const followUpSchema = new mongoose.Schema({
  // References
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Message content
  messageText: {
    type: String,
    required: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['resolution', 'progress', 'reopen', 'feedback'],
    required: true
  },
  
  // User language
  userLanguage: {
    type: String,
    default: 'en'
  },
  
  // Scheduling
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  sentAt: Date,
  
  // Delivery channel
  channel: {
    type: String,
    enum: ['sms', 'email', 'push', 'in-app'],
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Delivery tracking
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: Date,
  deliveryError: String,
  
  // User response
  response: {
    type: String,
    enum: ['satisfied', 'unsatisfied', 'no-response'],
    default: 'no-response'
  },
  responseText: String,
  responseAt: Date,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
followUpSchema.index({ scheduledAt: 1, status: 1 });
followUpSchema.index({ userId: 1, createdAt: -1 });
followUpSchema.index({ reportId: 1, messageType: 1 });

// Static methods
followUpSchema.statics.getPendingMessages = async function(limit = 100) {
  const now = new Date();
  return this.find({
    status: 'pending',
    scheduledAt: { $lte: now }
  })
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .populate('reportId userId');
};

followUpSchema.statics.getDeliveryStats = async function(startDate, endDate) {
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
        _id: {
          channel: '$channel',
          status: '$status'
        },
        count: { $sum: 1 },
        avgDeliveryAttempts: { $avg: '$deliveryAttempts' }
      }
    }
  ]);
};

followUpSchema.statics.getUserSatisfactionRate = async function(startDate, endDate) {
  const results = await this.aggregate([
    {
      $match: {
        sentAt: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date()
        },
        messageType: 'resolution'
      }
    },
    {
      $group: {
        _id: '$response',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = results.reduce((sum, r) => sum + r.count, 0);
  const satisfied = results.find(r => r._id === 'satisfied')?.count || 0;
  
  return {
    total,
    satisfied,
    unsatisfied: results.find(r => r._id === 'unsatisfied')?.count || 0,
    noResponse: results.find(r => r._id === 'no-response')?.count || 0,
    satisfactionRate: total > 0 ? (satisfied / total * 100).toFixed(2) : 0
  };
};

// Instance methods
followUpSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

followUpSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.deliveryAttempts += 1;
  this.lastAttemptAt = new Date();
  this.deliveryError = error;
  return this.save();
};

followUpSchema.methods.recordResponse = function(responseType, responseText) {
  this.response = responseType;
  this.responseText = responseText;
  this.responseAt = new Date();
  return this.save();
};

module.exports = mongoose.model('FollowUp', followUpSchema);
