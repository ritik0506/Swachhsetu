const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Create AI processing queue
const aiQueue = new Queue('ai-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200      // Keep last 200 failed jobs
  }
});

// Queue event listeners
aiQueue.on('error', (error) => {
  console.error('AI Queue Error:', error);
});

aiQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

aiQueue.on('active', (job) => {
  console.log(`Job ${job.id} is now active`);
});

aiQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

aiQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);
});

module.exports = { aiQueue, connection };
