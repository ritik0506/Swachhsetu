import { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';

/**
 * SmartImageUpload Component
 * 
 * Features:
 * - Drag-and-drop image upload
 * - Client-side image resizing (max 1024px width)
 * - Automatic spam detection via AI
 * - Real-time verification status
 * - Category detection
 * 
 * @param {Function} onVerify - Callback with verification result
 * @param {Function} onChange - Callback with file data
 * @param {number} maxWidth - Maximum image width (default: 1024)
 * @param {number} maxSizeMB - Maximum file size in MB (default: 10)
 * @param {boolean} isGlobalAILoading - Global AI loading state
 * @param {Function} setGlobalAILoading - Set global AI loading state
 */
const SmartImageUpload = ({ 
  onVerify, 
  onChange,
  maxWidth = 1024,
  maxSizeMB = 10,
  isGlobalAILoading,
  setGlobalAILoading
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  /**
   * Resize image client-side to save bandwidth
   */
  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(resizedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            file.type,
            0.9 // Quality (0.9 = 90%)
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Verify image using AI spam detection API
   */
  const verifyImage = async (file) => {
    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Call forensic analysis API
      const response = await api.post('/api/ai/forensic/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = {
        is_spam: response.data.is_spam || false,
        spam_reason: response.data.spam_reason || null,
        civic_category: response.data.civic_category || 'Unknown',
        visual_evidence: response.data.visual_evidence || '',
        severity_score: response.data.severity_score || 0,
        confidence: response.data.confidence || 0
      };

      setVerificationResult(result);

      // Call parent callback
      if (onVerify) {
        onVerify(result);
      }

      // If not spam, also call onChange with file
      if (!result.is_spam && onChange) {
        onChange(file);
      }

    } catch (err) {
      console.error('Image verification error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to verify image. Please try again.';
      setError(errorMessage);
      
      if (onVerify) {
        onVerify({ is_spam: false, error: errorMessage });
      }
    } finally {
      setIsVerifying(false);
      if (setGlobalAILoading) setGlobalAILoading(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    try {
      // Resize image
      const resizedFile = await resizeImage(file);
      
      // Create preview URL
      const preview = URL.createObjectURL(resizedFile);
      setPreviewUrl(preview);
      setSelectedImage(resizedFile);

      // Automatically verify image
      await verifyImage(resizedFile);

    } catch (err) {
      console.error('Image processing error:', err);
      setError('Failed to process image. Please try again.');
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Clear selection and reset
   */
  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setVerificationResult(null);
    setError(null);
    setIsVerifying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onVerify) {
      onVerify(null);
    }
    if (onChange) {
      onChange(null);
    }
  };

  /**
   * Cleanup preview URL on unmount
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        id="image-upload-input"
      />

      {!previewUrl ? (
        // Upload Zone
        <label
          htmlFor="image-upload-input"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative block w-full rounded-lg border-2 border-dashed p-8
            transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }
          `}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`
              p-4 rounded-full transition-colors
              ${isDragging 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }
            `}>
              {isDragging ? (
                <Upload className="w-8 h-8" />
              ) : (
                <Camera className="w-8 h-8" />
              )}
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                {isDragging ? 'Drop image here' : 'Upload Civic Issue Photo'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Supports: JPEG, PNG, GIF, WebP (Max {maxSizeMB}MB)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ImageIcon className="w-4 h-4" />
              <span>Auto-resize to {maxWidth}px • AI Spam Detection</span>
            </div>
          </div>
        </label>
      ) : (
        // Preview with Verification Status
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          {/* Image Preview */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto object-contain max-h-96"
          />

          {/* Verification Overlay */}
          {isVerifying && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-200 font-semibold">
                  Scanning for Spam...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  AI is verifying your image
                </p>
              </div>
            </div>
          )}

          {/* Spam Detection - Red Error */}
          {!isVerifying && verificationResult?.is_spam && (
            <div className="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Image Rejected
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {verificationResult.spam_reason || 'This image appears to be spam or inappropriate.'}
                </p>
                <button
                  onClick={handleClear}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Verified - Green Success */}
          {!isVerifying && verificationResult && !verificationResult.is_spam && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-green-500/90 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Verified</p>
                    <p className="text-sm text-green-100">
                      {verificationResult.civic_category || 'Civic Issue'} detected
                    </p>
                  </div>
                </div>
                <div className="text-white text-sm">
                  {verificationResult.confidence ? 
                    `${(verificationResult.confidence * 100).toFixed(0)}% confidence` : 
                    ''
                  }
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!isVerifying && error && (
            <div className="absolute top-0 left-0 right-0 bg-red-500/90 p-4">
              <div className="flex items-center gap-2 text-white">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Clear Button */}
          {!isVerifying && (
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Image Details */}
          {!isVerifying && verificationResult && !verificationResult.is_spam && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="text-white text-sm">
                {verificationResult.visual_evidence && (
                  <p className="mb-1">
                    <span className="font-semibold">Evidence:</span> {verificationResult.visual_evidence}
                  </p>
                )}
                {verificationResult.severity_score > 0 && (
                  <p>
                    <span className="font-semibold">Severity:</span>{' '}
                    <span className={`
                      ${verificationResult.severity_score >= 7 ? 'text-red-400' : 
                        verificationResult.severity_score >= 4 ? 'text-yellow-400' : 
                        'text-green-400'}
                    `}>
                      {verificationResult.severity_score}/10
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!previewUrl && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>✓ Images are automatically resized to {maxWidth}px width</p>
          <p>✓ AI verifies images are genuine civic issues (not selfies or screenshots)</p>
          <p>✓ Detected category and severity help prioritize your report</p>
        </div>
      )}
    </div>
  );
};

export default SmartImageUpload;
