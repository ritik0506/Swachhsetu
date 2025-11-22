const GarbageSchedule = require('../models/GarbageSchedule');

// @desc    Get garbage schedule by area
// @route   GET /api/garbage/schedule
// @access  Public
exports.getScheduleByArea = async (req, res) => {
  try {
    const { area, ward, zone, lat, lng, radius = 5 } = req.query;

    let query = { isActive: true };

    // Search by area name
    if (area) {
      query.$or = [
        { area: new RegExp(area, 'i') },
        { ward: new RegExp(area, 'i') },
        { zone: new RegExp(area, 'i') }
      ];
    }

    // Filter by ward
    if (ward) {
      query.ward = new RegExp(ward, 'i');
    }

    // Filter by zone
    if (zone) {
      query.zone = new RegExp(zone, 'i');
    }

    // Geospatial search if coordinates provided
    if (lat && lng) {
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const schedules = await GarbageSchedule.find(query)
      .populate('updatedBy', 'name email')
      .limit(20);

    // Add next collection info for each schedule
    const schedulesWithNext = schedules.map(schedule => {
      const scheduleObj = schedule.toObject();
      scheduleObj.nextCollection = schedule.getNextCollection();
      return scheduleObj;
    });

    res.json({
      success: true,
      count: schedules.length,
      schedules: schedulesWithNext
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch garbage schedule',
      error: error.message
    });
  }
};

// @desc    Get single schedule by ID
// @route   GET /api/garbage/schedule/:id
// @access  Public
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await GarbageSchedule.findById(req.params.id)
      .populate('updatedBy', 'name email')
      .populate('subscribers.userId', 'name email phone');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const scheduleObj = schedule.toObject();
    scheduleObj.nextCollection = schedule.getNextCollection();

    res.json({
      success: true,
      schedule: scheduleObj
    });
  } catch (error) {
    console.error('Get schedule by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule',
      error: error.message
    });
  }
};

// @desc    Create new garbage schedule
// @route   POST /api/garbage/schedule
// @access  Private (Admin)
exports.createSchedule = async (req, res) => {
  try {
    const scheduleData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const schedule = await GarbageSchedule.create(scheduleData);

    res.status(201).json({
      success: true,
      schedule,
      message: 'Garbage schedule created successfully'
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
};

// @desc    Update garbage schedule
// @route   PUT /api/garbage/schedule/:id
// @access  Private (Admin)
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await GarbageSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const updatedSchedule = await GarbageSchedule.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedBy: req.user.id,
        lastUpdated: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Emit socket event to notify subscribers
    const io = req.app.get('io');
    io.emit('scheduleUpdated', {
      scheduleId: updatedSchedule._id,
      area: updatedSchedule.area,
      message: 'Garbage collection schedule has been updated'
    });

    res.json({
      success: true,
      schedule: updatedSchedule,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
};

// @desc    Delete garbage schedule
// @route   DELETE /api/garbage/schedule/:id
// @access  Private (Admin)
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await GarbageSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    await schedule.deleteOne();

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
};

// @desc    Subscribe to schedule notifications
// @route   POST /api/garbage/schedule/:id/subscribe
// @access  Private
exports.subscribeToSchedule = async (req, res) => {
  try {
    const { notificationPreference = 'push' } = req.body;
    
    const schedule = await GarbageSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if already subscribed
    const existingSubscription = schedule.subscribers.find(
      sub => sub.userId.toString() === req.user.id
    );

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this schedule'
      });
    }

    // Add subscription
    schedule.subscribers.push({
      userId: req.user.id,
      notificationPreference,
      subscribedAt: Date.now()
    });

    await schedule.save();

    res.json({
      success: true,
      message: 'Successfully subscribed to schedule notifications'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe',
      error: error.message
    });
  }
};

// @desc    Unsubscribe from schedule notifications
// @route   DELETE /api/garbage/schedule/:id/subscribe
// @access  Private
exports.unsubscribeFromSchedule = async (req, res) => {
  try {
    const schedule = await GarbageSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Remove subscription
    schedule.subscribers = schedule.subscribers.filter(
      sub => sub.userId.toString() !== req.user.id
    );

    await schedule.save();

    res.json({
      success: true,
      message: 'Successfully unsubscribed from schedule notifications'
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe',
      error: error.message
    });
  }
};

// @desc    Get all unique areas/wards/zones
// @route   GET /api/garbage/locations
// @access  Public
exports.getUniqueLocations = async (req, res) => {
  try {
    const areas = await GarbageSchedule.distinct('area', { isActive: true });
    const wards = await GarbageSchedule.distinct('ward', { isActive: true });
    const zones = await GarbageSchedule.distinct('zone', { isActive: true });

    res.json({
      success: true,
      locations: {
        areas: areas.sort(),
        wards: wards.sort(),
        zones: zones.sort()
      }
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
};

// @desc    Get today's schedules
// @route   GET /api/garbage/today
// @access  Public
exports.getTodaySchedules = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const schedules = await GarbageSchedule.find({
      isActive: true,
      [`schedule.${today}.enabled`]: true
    })
    .populate('updatedBy', 'name')
    .limit(50);

    const todaySchedules = schedules.map(schedule => {
      const scheduleObj = schedule.toObject();
      // Safely access today's slots
      scheduleObj.todaySlots = schedule.schedule && schedule.schedule[today] 
        ? schedule.schedule[today].slots 
        : [];
      return scheduleObj;
    });

    res.json({
      success: true,
      day: today,
      count: todaySchedules.length,
      schedules: todaySchedules
    });
  } catch (error) {
    console.error('Get today schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s schedules',
      error: error.message
    });
  }
};

// @desc    Update collection statistics
// @route   POST /api/garbage/schedule/:id/mark-collection
// @access  Private (Admin/Moderator)
exports.markCollection = async (req, res) => {
  try {
    const { status, delay = 0 } = req.body; // status: completed, missed

    const schedule = await GarbageSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (status === 'completed') {
      schedule.statistics.totalCollections += 1;
      schedule.statistics.lastCollectionDate = new Date();
      
      // Update average delay
      const totalDelay = (schedule.statistics.averageDelay || 0) * (schedule.statistics.totalCollections - 1) + delay;
      schedule.statistics.averageDelay = Math.round(totalDelay / schedule.statistics.totalCollections);
    } else if (status === 'missed') {
      schedule.statistics.missedCollections += 1;
    }

    // Calculate next collection date
    const nextCollection = schedule.getNextCollection();
    if (nextCollection) {
      schedule.statistics.nextCollectionDate = nextCollection.date;
    }

    await schedule.save();

    res.json({
      success: true,
      message: 'Collection status updated',
      statistics: schedule.statistics
    });
  } catch (error) {
    console.error('Mark collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update collection status',
      error: error.message
    });
  }
};
