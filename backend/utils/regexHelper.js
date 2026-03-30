/**
 * Utility functions for safe regex operations
 * Prevents ReDoS (Regular Expression Denial of Service) attacks
 */

/**
 * Escapes special regex characters in a string
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string safe for RegExp
 */
const escapeRegExp = (string) => {
  if (typeof string !== 'string') {
    return '';
  }
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Creates a safe regex pattern from user input
 * @param {string} pattern - User input pattern
 * @param {string} [flags='i'] - Regex flags (default: case insensitive)
 * @returns {RegExp} - Safe RegExp object
 */
const createSafeRegex = (pattern, flags = 'i') => {
  const escaped = escapeRegExp(pattern);
  return new RegExp(escaped, flags);
};

/**
 * Creates a MongoDB-safe regex query object
 * @param {string} pattern - User input pattern
 * @returns {Object} - MongoDB $regex query object
 */
const createMongoRegex = (pattern) => {
  const escaped = escapeRegExp(pattern);
  return { $regex: escaped, $options: 'i' };
};

module.exports = {
  escapeRegExp,
  createSafeRegex,
  createMongoRegex
};
