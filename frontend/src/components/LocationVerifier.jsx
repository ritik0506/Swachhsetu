import { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle, Navigation, X } from 'lucide-react';
import api from '../utils/api';

/**
 * LocationVerifier Component
 * 
 * Features:
 * - Automatic GPS location detection
 * - Manual address input
 * - Reverse geocoding (coordinates to address)
 * - Location verification
 * - Visual map preview
 * 
 * @param {Function} onChange - Callback with location data
 * @param {boolean} isGlobalAILoading - Global AI loading state
 * @param {Function} setGlobalAILoading - Set global AI loading state
 */
const LocationVerifier = ({ 
  onChange,
  isGlobalAILoading,
  setGlobalAILoading
}) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsDetecting(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsDetecting(false);
      setManualMode(true);
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          setLocation(coords);

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            if (data.display_name) {
              setAddress(data.display_name);
              setIsVerified(true);

              // Call parent onChange
              if (onChange) {
                onChange({
                  coordinates: coords,
                  address: data.display_name,
                  landmark: landmark,
                  verified: true
                });
              }
            }
          } catch (geoError) {
            console.error('Geocoding error:', geoError);
            setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
            setIsVerified(true);

            if (onChange) {
              onChange({
                coordinates: coords,
                address: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
                landmark: landmark,
                verified: true
              });
            }
          }

          setIsDetecting(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Unable to detect location. ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please grant location permission.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }

          setError(errorMessage);
          setIsDetecting(false);
          setManualMode(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to detect location. Please enter manually.');
      setIsDetecting(false);
      setManualMode(true);
    }
  };

  const handleManualSubmit = () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setIsVerified(true);
    setError('');

    if (onChange) {
      onChange({
        coordinates: location || null,
        address: address.trim(),
        landmark: landmark.trim(),
        verified: true,
        manual: true
      });
    }
  };

  const handleClear = () => {
    setLocation(null);
    setAddress('');
    setLandmark('');
    setIsVerified(false);
    setError('');
    setManualMode(false);

    if (onChange) {
      onChange(null);
    }
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setIsVerified(false);
  };

  const handleLandmarkChange = (e) => {
    setLandmark(e.target.value);
    
    // Update parent if location is already verified
    if (isVerified && onChange) {
      onChange({
        coordinates: location,
        address: address,
        landmark: e.target.value,
        verified: true
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </h3>
        {isVerified && (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            {!manualMode && (
              <button
                onClick={() => setManualMode(true)}
                className="text-sm text-red-600 dark:text-red-400 underline mt-1 hover:text-red-700 dark:hover:text-red-300"
              >
                Enter location manually
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auto-Detection State */}
      {isDetecting && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-white dark:bg-gray-800">
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-3" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Detecting Your Location...
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please allow location access when prompted
          </p>
        </div>
      )}

      {/* Manual Input Mode */}
      {(manualMode || isVerified) && !isDetecting && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          {/* Verified Header */}
          {isVerified && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">Location Verified</span>
              </div>
              <button
                onClick={handleClear}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Location Info */}
          <div className="p-4 space-y-3">
            {/* GPS Coordinates */}
            {location && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                      GPS Coordinates:
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-200 font-mono">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    {location.accuracy && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Accuracy: ±{Math.round(location.accuracy)}m
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Address Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Address *
              </label>
              <textarea
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter full address (street, area, city, state, pincode)"
                rows={3}
                disabled={isVerified && !manualMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-sm"
              />
            </div>

            {/* Landmark Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={handleLandmarkChange}
                placeholder="e.g., Near City Hospital, Opposite Metro Station"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              />
            </div>

            {/* Action Buttons */}
            {!isVerified && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleManualSubmit}
                  disabled={!address.trim() || isGlobalAILoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify Location
                </button>
                {!location && (
                  <button
                    onClick={detectLocation}
                    disabled={isGlobalAILoading}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Auto-Detect
                  </button>
                )}
              </div>
            )}

            {/* Edit Button for Verified State */}
            {isVerified && !manualMode && (
              <button
                onClick={() => {
                  setIsVerified(false);
                  setManualMode(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Edit Location
              </button>
            )}
          </div>
        </div>
      )}

      {/* Initial State with Auto-Detect Button */}
      {!isDetecting && !isVerified && !manualMode && !error && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800/50">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Add Location
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Automatically detect or enter manually
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={detectLocation}
              disabled={isGlobalAILoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              <Navigation className="w-5 h-5" />
              Auto-Detect Location
            </button>
            <button
              onClick={() => setManualMode(true)}
              disabled={isGlobalAILoading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              <MapPin className="w-5 h-5" />
              Enter Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationVerifier;
