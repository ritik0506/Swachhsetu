const mongoose = require('mongoose');

const garbageScheduleSchema = new mongoose.Schema({
  area: {
    type: String,
    required: [true, 'Area name is required'],
    trim: true,
    index: true
  },
  ward: {
    type: String,
    required: true,
    trim: true
  },
  zone: {
    type: String,
    required: true,
    trim: true
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
    address: String
  },
  schedule: {
    monday: {
      enabled: { type: Boolean, default: false },
      slots: [{
        startTime: String,  // "06:00 AM"
        endTime: String,    // "08:00 AM"
        wasteType: {
          type: String,
          enum: ['mixed', 'organic', 'recyclable', 'hazardous', 'e-waste', 'construction'],
          default: 'mixed'
        }
      }]
    },
    tuesday: {
      enabled: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String,
        wasteType: String
      }]
    },
    wednesday: {
      enabled: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String,
        wasteType: String
      }]
    },
    thursday: {
      enabled: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String,
        wasteType: String
      }]
    },
    friday: {
      enabled: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String,
        wasteType: String
      }]
    },
    saturday: {
      enabled: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String,
        wasteType: String
      }]
    },
    sunday: {
      enabled: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String,
        wasteType: String
      }]
    }
  },
  vehicles: [{
    vehicleNumber: {
      type: String,
      required: true
    },
    vehicleType: {
      type: String,
      enum: ['compactor', 'tipper', 'mini-truck', 'e-rickshaw'],
      default: 'compactor'
    },
    capacity: String,  // "5 tons"
    driverName: String,
    driverContact: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    }
  }],
  route: {
    routeNumber: String,
    routeName: String,
    totalStops: Number,
    estimatedDuration: String,  // "2 hours"
    coverageRadius: Number       // in kilometers
  },
  specialInstructions: String,
  holidays: [{
    date: Date,
    reason: String,
    alternateDate: Date
  }],
  contactPerson: {
    name: String,
    phone: String,
    email: String,
    designation: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subscribers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notificationPreference: {
      type: String,
      enum: ['sms', 'email', 'push', 'all'],
      default: 'push'
    },
    subscribedAt: Date
  }],
  statistics: {
    totalCollections: { type: Number, default: 0 },
    missedCollections: { type: Number, default: 0 },
    averageDelay: Number,  // in minutes
    lastCollectionDate: Date,
    nextCollectionDate: Date
  }
}, {
  timestamps: true
});

// Indexes
garbageScheduleSchema.index({ location: '2dsphere' });
garbageScheduleSchema.index({ area: 'text', ward: 'text', zone: 'text' });
garbageScheduleSchema.index({ 'route.routeNumber': 1 });
garbageScheduleSchema.index({ isActive: 1 });

// Methods
garbageScheduleSchema.methods.getNextCollection = function() {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  let nextDay = currentDay;
  let daysChecked = 0;
  
  while (daysChecked < 7) {
    const daySchedule = this.schedule[nextDay];
    if (daySchedule && daySchedule.enabled && daySchedule.slots.length > 0) {
      return {
        day: nextDay,
        slots: daySchedule.slots,
        date: this.getNextDate(nextDay)
      };
    }
    
    const currentIndex = days.indexOf(nextDay);
    nextDay = days[(currentIndex + 1) % 7];
    daysChecked++;
  }
  
  return null;
};

garbageScheduleSchema.methods.getNextDate = function(dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  const todayIndex = today.getDay();
  const targetIndex = days.indexOf(dayName);
  
  let daysUntilTarget = targetIndex - todayIndex;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  return targetDate;
};

module.exports = mongoose.model('GarbageSchedule', garbageScheduleSchema);
