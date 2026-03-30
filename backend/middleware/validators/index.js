/**
 * Input validation middleware using express-validator
 * Provides validation rules for all API endpoints
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors and return standardized response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Auth validators
 */
const authValidators = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any').withMessage('Please provide a valid phone number'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any').withMessage('Please provide a valid phone number'),
    body('darkMode')
      .optional()
      .isBoolean().withMessage('darkMode must be a boolean'),
    handleValidationErrors
  ]
};

/**
 * Report validators
 */
const reportValidators = {
  create: [
    body('category')
      .notEmpty().withMessage('Category is required')
      .isIn(['waste', 'pothole', 'streetlight', 'water', 'sewage', 'garbage', 'other'])
      .withMessage('Invalid category'),
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
    handleValidationErrors
  ],

  updateStatus: [
    param('id')
      .isMongoId().withMessage('Invalid report ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ],

  getById: [
    param('id')
      .isMongoId().withMessage('Invalid report ID'),
    handleValidationErrors
  ],

  addComment: [
    param('id')
      .isMongoId().withMessage('Invalid report ID'),
    body('text')
      .trim()
      .notEmpty().withMessage('Comment text is required')
      .isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters'),
    handleValidationErrors
  ],

  list: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .isIn(['waste', 'pothole', 'streetlight', 'water', 'sewage', 'garbage', 'other'])
      .withMessage('Invalid category'),
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ]
};

/**
 * Garbage schedule validators
 */
const garbageValidators = {
  create: [
    body('area')
      .trim()
      .notEmpty().withMessage('Area is required')
      .isLength({ min: 2, max: 100 }).withMessage('Area must be 2-100 characters'),
    body('ward')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Ward must be max 50 characters'),
    body('zone')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Zone must be max 50 characters'),
    body('collectionDays')
      .isArray({ min: 1 }).withMessage('At least one collection day is required'),
    body('collectionDays.*')
      .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .withMessage('Invalid collection day'),
    body('timeSlot')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Time slot must be in format HH:MM - HH:MM'),
    handleValidationErrors
  ],

  search: [
    query('area')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Area must be 2-100 characters'),
    query('pincode')
      .optional()
      .matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
    handleValidationErrors
  ]
};

/**
 * Admin validators
 */
const adminValidators = {
  updateUserRole: [
    param('userId')
      .isMongoId().withMessage('Invalid user ID'),
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['user', 'moderator', 'admin']).withMessage('Invalid role'),
    handleValidationErrors
  ],

  getUsers: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(['user', 'moderator', 'admin']).withMessage('Invalid role filter'),
    handleValidationErrors
  ]
};

/**
 * AI route validators
 */
const aiValidators = {
  translate: [
    body('text')
      .trim()
      .notEmpty().withMessage('Text is required')
      .isLength({ max: 5000 }).withMessage('Text must be max 5000 characters'),
    body('targetLanguage')
      .notEmpty().withMessage('Target language is required')
      .isLength({ min: 2, max: 10 }).withMessage('Invalid language code'),
    body('sourceLanguage')
      .optional()
      .isLength({ min: 2, max: 10 }).withMessage('Invalid language code'),
    handleValidationErrors
  ],

  chatbot: [
    body('sessionId')
      .notEmpty().withMessage('Session ID is required')
      .isLength({ min: 1, max: 100 }).withMessage('Invalid session ID'),
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ max: 1000 }).withMessage('Message must be max 1000 characters'),
    handleValidationErrors
  ],

  linguistic: [
    body('transcript')
      .trim()
      .notEmpty().withMessage('Transcript is required')
      .isLength({ max: 10000 }).withMessage('Transcript must be max 10000 characters'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  authValidators,
  reportValidators,
  garbageValidators,
  adminValidators,
  aiValidators
};
