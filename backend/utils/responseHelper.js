/**
 * Standardized API response helpers
 * Ensures consistent response format across all endpoints
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to include in response
 * @param {string} [message='Success'] - Success message
 * @param {number} [statusCode=200] - HTTP status code
 */
const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Object} [errors=null] - Additional error details
 */
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors && process.env.NODE_ENV !== 'production') {
    response.error = errors.message || errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Send a not found response
 * @param {Object} res - Express response object
 * @param {string} [resource='Resource'] - Name of the resource not found
 */
const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`
  });
};

/**
 * Send an unauthorized response
 * @param {Object} res - Express response object
 * @param {string} [message='Unauthorized'] - Error message
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Send a forbidden response
 * @param {Object} res - Express response object
 * @param {string} [message='Forbidden'] - Error message
 */
const forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse
};
