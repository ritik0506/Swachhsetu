const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Points system
  totalPoints: {
    type: Number,
    default: 0
  },
  // Achievements
  achievements: [{
    name: String,
    description: String,
    icon: String,
    points: Number,
    unlockedAt: Date,
    category: String
  }],
  // Streaks
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: Date,
  // Activity stats
  stats: {
    reportsSubmitted: { type: Number, default: 0 },
    reportsVerified: { type: Number, default: 0 },
    commentsPosted: { type: Number, default: 0 },
    upvotesReceived: { type: Number, default: 0 },
    helpfulReviews: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 }
  },
  // Level progression
  level: {
    current: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    nextLevelXp: { type: Number, default: 100 }
  },
  // Badges
  badges: [{
    id: String,
    name: String,
    tier: String, // bronze, silver, gold, platinum
    earnedAt: Date,
    progress: Number,
    maxProgress: Number
  }],
  // Ranking
  rank: {
    global: Number,
    local: Number,
    category: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Gamification', gamificationSchema);
