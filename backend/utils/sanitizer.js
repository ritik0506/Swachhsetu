/**
 * Input Sanitization Utility
 * Prevents prompt injection, XSS, and malicious content
 */

/**
 * Sanitize text input for AI models
 * Prevents prompt injection attacks
 */
function sanitizeAIInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove potentially malicious prompt injection patterns
  const injectionPatterns = [
    // System prompt override attempts
    /system[:\s]*you are/gi,
    /ignore (previous|all) (instructions?|prompts?)/gi,
    /disregard (previous|all) (instructions?|prompts?)/gi,
    /forget (everything|all) (before|previous)/gi,
    
    // Role manipulation attempts
    /you are now/gi,
    /act as/gi,
    /pretend (you are|to be)/gi,
    /roleplay as/gi,
    
    // Instruction override
    /new instructions?:/gi,
    /updated instructions?:/gi,
    /override (instructions?|system)/gi,
    
    // Delimiter injection
    /---/g,
    /###/g,
    /```/g,
    
    // Script tags and HTML
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
  ];

  // Apply sanitization patterns
  injectionPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Limit length to prevent abuse
  const maxLength = 5000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize transcript for linguistic analysis
 */
function sanitizeTranscript(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Invalid transcript: must be a non-empty string');
  }

  const sanitized = sanitizeAIInput(transcript);

  if (sanitized.length < 5) {
    throw new Error('Transcript too short after sanitization');
  }

  return sanitized;
}

/**
 * Sanitize chat message
 */
function sanitizeChatMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message: must be a non-empty string');
  }

  const sanitized = sanitizeAIInput(message);

  if (sanitized.length === 0) {
    throw new Error('Message cannot be empty after sanitization');
  }

  return sanitized;
}

/**
 * Validate and sanitize image base64 data
 */
function sanitizeImageData(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('Invalid image data');
  }

  // Check if it's a valid base64 string
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  
  if (!base64Pattern.test(imageData)) {
    throw new Error('Invalid image format');
  }

  // Extract base64 content
  const base64Content = imageData.split(',')[1];
  
  // Check size (max 10MB)
  const sizeInBytes = (base64Content.length * 3) / 4;
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (sizeInBytes > maxSize) {
    throw new Error('Image size exceeds 10MB limit');
  }

  return imageData;
}

/**
 * Sanitize AI model output before sending to client
 * Prevents reflected XSS
 */
function sanitizeAIOutput(output) {
  if (!output) return output;

  if (typeof output === 'string') {
    // Remove any script tags or dangerous HTML
    return output
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onerror\s*=/gi, '')
      .replace(/onclick\s*=/gi, '');
  }

  if (typeof output === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(output)) {
      sanitized[key] = sanitizeAIOutput(value);
    }
    return sanitized;
  }

  return output;
}

/**
 * Validate file upload
 */
function validateFileUpload(file) {
  if (!file) {
    throw new Error('No file uploaded');
  }

  // Allowed MIME types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only images are allowed.');
  }

  // Max file size: 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  return true;
}

/**
 * Rate limit check for user
 */
function checkUserRateLimit(userId, action, limit = 10, windowMs = 15 * 60 * 1000) {
  // This would typically use Redis or in-memory cache
  // For now, returning true (implement with actual rate limiting logic)
  return true;
}

module.exports = {
  sanitizeAIInput,
  sanitizeTranscript,
  sanitizeChatMessage,
  sanitizeImageData,
  sanitizeAIOutput,
  validateFileUpload,
  checkUserRateLimit
};
