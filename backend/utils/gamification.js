/**
 * Gamification utility functions
 * Shared logic for awarding points and managing user progression
 */

const Gamification = require('../models/Gamification');
const Notification = require('../models/Notification');
const logger = require('./logger');

/**
 * Award points to a user and update their gamification profile
 * @param {string} userId - User ID to award points to
 * @param {number} points - Number of points to award
 * @param {string} action - Action type for statistics tracking
 * @returns {Promise<Object>} - Updated gamification profile
 */
const awardPoints = async (userId, points, action) => {
  try {
    let gamification = await Gamification.findOne({ userId });

    if (!gamification) {
      gamification = await Gamification.create({
        userId,
        totalPoints: 0,
        stats: {}
      });
    }

    gamification.totalPoints += points;

    if (!gamification.stats) {
      gamification.stats = {};
    }
    gamification.stats[action] = (gamification.stats[action] || 0) + 1;

    // Update level (cap at 100 per FR-7 specification)
    gamification.level.xp += points;
    while (gamification.level.xp >= gamification.level.nextLevelXp && gamification.level.current < 100) {
      gamification.level.current += 1;
      gamification.level.xp -= gamification.level.nextLevelXp;
      gamification.level.nextLevelXp = Math.floor(gamification.level.nextLevelXp * 1.5);

      try {
        await Notification.create({
          userId,
          type: 'level_up',
          title: 'Level Up!',
          message: `Congratulations! You've reached level ${gamification.level.current}`,
          priority: 'high'
        });
      } catch (notifError) {
        logger.warn('Failed to create level up notification:', notifError.message);
      }
    }

    // If at max level (100), keep accumulating XP but don't level up
    if (gamification.level.current >= 100) {
      gamification.level.current = 100;
    }

    await gamification.save();
    return gamification;
  } catch (error) {
    logger.error('Award points error:', error);
    throw error;
  }
};

/**
 * Get user's gamification stats
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Gamification profile or null
 */
const getGamificationStats = async (userId) => {
  try {
    return await Gamification.findOne({ userId });
  } catch (error) {
    logger.error('Get gamification stats error:', error);
    return null;
  }
};

module.exports = {
  awardPoints,
  getGamificationStats
};
