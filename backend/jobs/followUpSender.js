/**
 * Follow-up Sender Job
 * Processes pending follow-ups and sends them via appropriate channels
 */

const cron = require('node-schedule');
const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

/**
 * Send pending follow-ups
 */
async function sendPendingFollowUps() {
  try {
    console.log('🔄 Checking for pending follow-ups...');
    
    // Get follow-ups scheduled for now or earlier
    const pendingFollowUps = await FollowUp.getPendingMessages(50);
    
    if (pendingFollowUps.length === 0) {
      console.log('✅ No pending follow-ups');
      return;
    }
    
    console.log(`📬 Found ${pendingFollowUps.length} pending follow-ups`);
    
    for (const followUp of pendingFollowUps) {
      try {
        // Get user details
        const user = await User.findById(followUp.userId);
        if (!user) {
          console.warn(`User ${followUp.userId} not found for follow-up ${followUp._id}`);
          followUp.status = 'failed';
          followUp.deliveryError = 'User not found';
          await followUp.save();
          continue;
        }
        
        // Send notification
        const results = await notificationService.sendFollowUp(user, followUp);
        
        const allFailed = results.every(r => !r.success);
        if (allFailed) {
          console.error(`Failed to send follow-up ${followUp._id} via any channel`);
          followUp.status = 'failed';
          followUp.deliveryAttempts += 1;
          followUp.lastAttemptAt = new Date();
          followUp.deliveryError = results.map(r => `${r.channel}: ${r.error}`).join('; ');
          await followUp.save();
        } else {
          console.log(`✅ Follow-up ${followUp._id} sent successfully`);
        }
        
      } catch (error) {
        console.error(`Error processing follow-up ${followUp._id}:`, error);
        followUp.status = 'failed';
        followUp.deliveryAttempts += 1;
        followUp.lastAttemptAt = new Date();
        followUp.deliveryError = error.message;
        await followUp.save();
      }
    }
    
    console.log('✅ Follow-up processing complete');
    
  } catch (error) {
    console.error('Error in sendPendingFollowUps:', error);
  }
}

/**
 * Start the follow-up sender cron job
 * Runs every 5 minutes
 */
function startFollowUpSender() {
  if (process.env.ENABLE_AI_FOLLOWUP !== 'true') {
    console.log('⏸️  Follow-up sender disabled (ENABLE_AI_FOLLOWUP=false)');
    return;
  }
  
  // Run every 5 minutes
  const job = cron.scheduleJob('*/5 * * * *', sendPendingFollowUps);
  
  console.log('✅ Follow-up sender cron job started (runs every 5 minutes)');
  
  // Run once immediately on startup
  setTimeout(sendPendingFollowUps, 5000); // Wait 5 seconds after startup
  
  return job;
}

module.exports = {
  sendPendingFollowUps,
  startFollowUpSender
};
