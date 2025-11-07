import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { toast } from 'react-toastify';
import { reportAPI } from '../utils/api';
import 'leaflet/dist/leaflet.css';
import './EnhancedReportIssue.css';

// Fix for default marker icon in React-Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

const EnhancedReportIssue = () => {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    severity: 'medium',
    address: '',
    landmark: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [position, setPosition] = useState([28.6139, 77.2090]); // Default: New Delhi
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append('category', formData.category);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('severity', formData.severity);
      data.append('location', JSON.stringify({
        coordinates: [position[1], position[0]], // [lng, lat] for GeoJSON
        address: formData.address,
        landmark: formData.landmark
      }));

      images.forEach(image => {
        data.append('images', image);
      });

      await reportAPI.createReport(data);
      
      toast.success('Report submitted successfully! 🎉');
      
      // Reset form
      setFormData({
        category: '',
        title: '',
        description: '',
        severity: 'medium',
        address: '',
        landmark: ''
      });
      setImages([]);
      setImagePreviews([]);
      setStep(1);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'toilet', label: '🚻 Public Toilet', icon: '🚻' },
    { value: 'waste', label: '🗑️ Waste Dump', icon: '🗑️' },
    { value: 'restaurant', label: '🍽️ Restaurant Hygiene', icon: '🍽️' },
    { value: 'beach', label: '🏖️ Beach/River', icon: '🏖️' },
    { value: 'street', label: '🛣️ Street Cleaning', icon: '🛣️' },
    { value: 'park', label: '🌳 Park/Garden', icon: '🌳' },
    { value: 'water', label: '💧 Water Quality', icon: '💧' },
    { value: 'other', label: '📋 Other', icon: '📋' }
  ];

  return (
    <div className="enhanced-report-container">
      <motion.div 
        className="report-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="report-header">
          <h1>Report Hygiene Issue</h1>
          <p>Help keep your city clean by reporting issues</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Category</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Details</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Location</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Category Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3>Select Issue Category</h3>
              <div className="category-grid">
                {categories.map(cat => (
                  <div
                    key={cat.value}
                    className={`category-card ${formData.category === cat.value ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-label">{cat.label.replace(/[^\w\s]/gi, '')}</span>
                  </div>
                ))}
              </div>
              <button 
                type="button"
                className="btn btn-primary next-btn"
                onClick={() => formData.category && setStep(2)}
                disabled={!formData.category}
              >
                Next →
              </button>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="form-group">
                <label className="form-label">Issue Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Provide detailed information about the issue..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select
                  name="severity"
                  className="form-select"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Images (Max 5)</label>
                <div className="image-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <Camera size={32} />
                    <span>Click to upload images</span>
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="image-previews">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="button-group">
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStep(3)}
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={18} />
                  Select Location on Map
                </label>
                <div className="map-container">
                  <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                <p className="map-hint">Click on the map to set the exact location</p>
              </div>

              <div className="form-group">
                <label className="form-label">Address *</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nearby Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  className="form-input"
                  placeholder="e.g., Near Central Park, Opposite Mall"
                  value={formData.landmark}
                  onChange={handleChange}
                />
              </div>

              <div className="button-group">
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(2)}
                >
                  ← Back
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Report ✓'}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default EnhancedReportIssue;
