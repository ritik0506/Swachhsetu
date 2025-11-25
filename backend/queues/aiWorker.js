const { Worker } = require('bullmq');
const { connection } = require('./aiQueue');
const aiTriageService = require('../services/aiTriageService');
const aiTranslationService = require('../services/aiTranslationService');
const aiFollowupService = require('../services/aiFollowupService');
const Report = require('../models/Report');
const FollowUp = require('../models/FollowUp');
const AIProcessingLog = require('../models/AIProcessingLog');

/**
 * AI Worker - Processes AI jobs from the queue
 */
const aiWorker = new Worker(
  'ai-processing',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);
    
    try {
      switch (job.name) {
        case 'triage-report':
          return await processTriageJob(job);
        
        case 'translate-text':
          return await processTranslationJob(job);
        
        case 'generate-followup':
          return await processFollowupJob(job);
        
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`Job ${job.id} error:`, error);
      
      // Log failed processing
      await AIProcessingLog.create({
        jobType: job.name,
        jobId: job.id,
        data: job.data,
        status: 'failed',
        error: error.message,
        attempts: job.attemptsMade
      });
      
      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection,
    concurrency: 3, // Process 3 jobs concurrently
    limiter: {
      max: 10,      // Max 10 jobs
      duration: 1000 // Per 1 second
    }
  }
);

/**
 * Process report triage job
 */
async function processTriageJob(job) {
  const { reportId, reportData } = job.data;
  
  // Perform AI triage
  const triageResult = await aiTriageService.triageReport(reportData);
  
  if (!triageResult.success) {
    throw new Error(`Triage failed: ${triageResult.error}`);
  }
  
  // Update report with AI results
  await Report.findByIdAndUpdate(reportId, {
    $set: {
      'ai_analysis.triage_completed': true,
      'ai_analysis.triage_timestamp': new Date(),
      'ai_analysis.refined_category': triageResult.refined_category,
      'ai_analysis.severity': triageResult.severity,
      'ai_analysis.priority': triageResult.priority,
      'ai_analysis.suggested_title': triageResult.suggested_title,
      'ai_analysis.recommended_action': triageResult.recommended_action,
      'ai_analysis.confidence': triageResult.confidence,
      'ai_analysis.rationale': triageResult.rationale,
      'ai_analysis.tags': triageResult.tags,
      'ai_analysis.language': triageResult.language
    }
  });
  
  // Log successful processing
  await AIProcessingLog.create({
    jobType: 'triage-report',
    jobId: job.id,
    reportId: reportId,
    data: reportData,
    result: triageResult,
    status: 'completed',
    processingTime: triageResult.processing_time_ms,
    attempts: job.attemptsMade
  });
  
  return triageResult;
}

/**
 * Process translation job
 */
async function processTranslationJob(job) {
  const { text, targetLanguage, sourceLanguage, referenceId, referenceType } = job.data;
  
  // Perform translation
  const translationResult = await aiTranslationService.translate(
    text,
    targetLanguage,
    sourceLanguage
  );
  
  if (!translationResult.success) {
    throw new Error(`Translation failed: ${translationResult.error}`);
  }
  
  // Log successful processing
  await AIProcessingLog.create({
    jobType: 'translate-text',
    jobId: job.id,
    referenceId: referenceId,
    referenceType: referenceType,
    data: { text, targetLanguage, sourceLanguage },
    result: translationResult,
    status: 'completed',
    processingTime: translationResult.processing_time_ms,
    attempts: job.attemptsMade
  });
  
  return translationResult;
}

/**
 * Process follow-up generation job
 */
async function processFollowupJob(job) {
  const followupData = job.data;
  
  // Generate follow-up message
  const followupResult = await aiFollowupService.generateFollowup(followupData);
  
  if (!followupResult.success) {
    throw new Error(`Follow-up generation failed: ${followupResult.error}`);
  }
  
  // Create FollowUp record
  const followUp = await FollowUp.create({
    reportId: followupData.reportId,
    userId: followupData.userId,
    messageText: followupResult.message,
    messageType: 'resolution',
    userLanguage: followupData.userLanguage || 'en',
    scheduledAt: new Date(), // Send now (job was already delayed)
    channel: 'in-app', // Default to in-app, can be updated
    status: 'pending'
  });
  
  // Log successful processing
  await AIProcessingLog.create({
    jobType: 'generate-followup',
    jobId: job.id,
    reportId: followupData.reportId,
    userId: followupData.userId,
    data: followupData,
    result: { ...followupResult, followUpId: followUp._id },
    status: 'completed',
    processingTime: followupResult.processing_time_ms,
    attempts: job.attemptsMade
  });
  
  return { ...followupResult, followUpId: followUp._id };
}

// Worker event listeners
aiWorker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} (${job.name}) completed successfully`);
});

aiWorker.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts:`, error.message);
});

aiWorker.on('error', (error) => {
  console.error('Worker error:', error);
});

module.exports = aiWorker;
