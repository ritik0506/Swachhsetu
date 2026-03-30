/**
 * Logger utility for production-ready logging
 * Replaces console.log statements with structured logging
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

const shouldLog = (level) => {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
};

const formatMessage = (level, ...args) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return [prefix, ...args];
};

const logger = {
  error: (...args) => {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', ...args));
    }
  },

  warn: (...args) => {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', ...args));
    }
  },

  info: (...args) => {
    if (shouldLog('info')) {
      console.log(...formatMessage('info', ...args));
    }
  },

  debug: (...args) => {
    if (shouldLog('debug')) {
      console.log(...formatMessage('debug', ...args));
    }
  }
};

module.exports = logger;
