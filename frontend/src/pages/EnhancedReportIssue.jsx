import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, Upload, AlertCircle, CheckCircle, Mic, X, Search, Navigation, Layers, ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Popup, useMap } from 'react-leaflet';
import { toast } from 'react-toastify';
import api, { reportAPI } from '../utils/api';
import VoiceInput from '../components/VoiceInput';
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

// Custom map controls component
function MapControls({ map, position, setPosition }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapStyle, setMapStyle] = useState('standard');

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Use backend proxy to avoid CORS issues
      const response = await api.get(`/geocoding/search?q=${encodeURIComponent(searchQuery)}`);
      
      const data = response.data;
      
      if (data.success && data.results && data.results.length > 0) {
        const { lat, lon } = data.results[0];
        const newPos = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        map.flyTo(newPos, 15);
        toast.success('Location found!');
      } else {
        toast.error('Location not found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search unavailable. Please use current location or click on map.');
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          map.flyTo(newPos, 15);
          toast.success('Location updated!');
        },
        () => toast.error('Unable to get location')
      );
    }
  };

  const mapStyles = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Search Box */}
      <div style={{
        display: 'flex',
        gap: '4px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '14px',
            width: '200px'
          }}
        />
        <button
          onClick={searchLocation}
          disabled={isSearching}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Search size={16} />
        </button>
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <button
          onClick={getCurrentLocation}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Get current location"
        >
          <Navigation size={20} color="#10b981" />
        </button>

        <button
          onClick={() => {
            const styles = ['standard', 'satellite', 'dark'];
            const currentIndex = styles.indexOf(mapStyle);
            const nextStyle = styles[(currentIndex + 1) % styles.length];
            setMapStyle(nextStyle);
          }}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Change map style"
        >
          <Layers size={20} color="#10b981" />
        </button>

        <button
          onClick={() => map.zoomIn()}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Zoom in"
        >
          <ZoomIn size={20} color="#10b981" />
        </button>

        <button
          onClick={() => map.zoomOut()}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Zoom out"
        >
          <ZoomOut size={20} color="#10b981" />
        </button>
      </div>

      {/* Hidden TileLayer controller */}
      <TileLayer
        key={mapStyle}
        url={mapStyles[mapStyle]}
        attribution='&copy; OpenStreetMap'
      />
    </div>
  );
}

// Map controller to access map instance
function MapController({ position, setPosition }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <>
      <Marker position={position}>
        <Popup>
          <div style={{ textAlign: 'center' }}>
            <strong>Report Location</strong><br />
            <small>{position[0].toFixed(6)}, {position[1].toFixed(6)}</small>
          </div>
        </Popup>
      </Marker>
      <Circle
        center={position}
        radius={50}
        pathOptions={{
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.2
        }}
      />
      <MapControls map={map} position={position} setPosition={setPosition} />
    </>
  );
}

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
    landmark: '',
    // Category-specific fields
    wasteType: '', // For waste reports
    wasteVolume: '', // For waste reports
    daysPresent: '', // For waste reports
    toiletType: '', // For toilet reports
    facilityIssue: [], // For toilet reports (multiple)
    restaurantName: '', // For restaurant reports
    licenseNumber: '', // For restaurant reports
    hygieneIssue: [], // For restaurant reports (multiple)
    waterSource: '', // For water quality reports
    pollutionType: '', // For beach/river reports
    vehicleNumber: '', // Optional for all
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [position, setPosition] = useState([28.6139, 77.2090]); // Default: New Delhi
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isGlobalAILoading, setGlobalAILoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

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
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox arrays (for multiple selections)
    if (type === 'checkbox') {
      setFormData(prev => {
        const currentArray = prev[name] || [];
        if (checked) {
          return { ...prev, [name]: [...currentArray, value] };
        } else {
          return { ...prev, [name]: currentArray.filter(item => item !== value) };
        }
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVoiceInput = (voiceData) => {
    if (voiceData) {
      const description = voiceData.summary || voiceData.transcript || '';
      
      // Update description with voice transcript
      setFormData(prev => ({
        ...prev,
        description: description
      }));
      
      // Close modal
      setShowVoiceModal(false);
      
      toast.success('Voice input added to description');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    addImages(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    addImages(files);
  };

  const addImages = (files) => {
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
    { 
      value: 'waste', 
      label: 'Waste Dump', 
      icon: '🗑️',
      description: 'Report garbage, litter, or illegal dumping'
    },
    { 
      value: 'toilet', 
      label: 'Public Toilet', 
      icon: '🚻',
      description: 'Report issues with public restrooms'
    },
    { 
      value: 'restaurant', 
      label: 'Restaurant Hygiene', 
      icon: '🍽️',
      description: 'Report food safety and hygiene concerns'
    },
    { 
      value: 'water', 
      label: 'Water Quality', 
      icon: '💧',
      description: 'Report contaminated or stagnant water'
    },
    { 
      value: 'beach', 
      label: 'Beach/River', 
      icon: '🏖️',
      description: 'Report pollution in water bodies'
    },
    { 
      value: 'street', 
      label: 'Street Cleaning', 
      icon: '🛣️',
      description: 'Report dirty streets or pavements'
    },
    { 
      value: 'park', 
      label: 'Park/Garden', 
      icon: '🌳',
      description: 'Report issues in public parks'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: '📋',
      description: 'Report other hygiene concerns'
    }
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
              <h3 style={{ marginBottom: '24px', color: '#111827', fontSize: '24px' }}>Select Issue Category</h3>
              <div className="category-grid">
                {categories.map(cat => (
                  <div
                    key={cat.value}
                    className={`category-card ${formData.category === cat.value ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: formData.category === cat.value ? '2px solid #10b981' : '2px solid #e5e7eb',
                      backgroundColor: formData.category === cat.value ? '#f0fdf4' : 'white'
                    }}
                  >
                    <span className="category-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>{cat.icon}</span>
                    <span className="category-label" style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      fontSize: '16px',
                      marginBottom: '4px'
                    }}>
                      {cat.label}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      textAlign: 'center',
                      display: 'block'
                    }}>
                      {cat.description}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                type="button"
                className="btn btn-primary next-btn"
                onClick={() => formData.category && setStep(2)}
                disabled={!formData.category}
                style={{
                  marginTop: '32px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Description *</span>
                  <button
                    type="button"
                    onClick={() => setShowVoiceModal(true)}
                    className="voice-input-btn"
                    title="Add voice description"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
                    }}
                  >
                    <Mic size={18} />
                  </button>
                </label>
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

              {/* Category-Specific Fields */}
              {formData.category === 'waste' && (
                <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#111827', fontSize: '18px' }}>Waste Details</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Type of Waste</label>
                    <select
                      name="wasteType"
                      className="form-select"
                      value={formData.wasteType}
                      onChange={handleChange}
                    >
                      <option value="">Select waste type</option>
                      <option value="household">Household Waste</option>
                      <option value="construction">Construction Debris</option>
                      <option value="plastic">Plastic Waste</option>
                      <option value="medical">Medical Waste</option>
                      <option value="electronic">Electronic Waste</option>
                      <option value="mixed">Mixed Waste</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estimated Volume</label>
                    <select
                      name="wasteVolume"
                      className="form-select"
                      value={formData.wasteVolume}
                      onChange={handleChange}
                    >
                      <option value="">Select volume</option>
                      <option value="small">Small (Few bags)</option>
                      <option value="medium">Medium (Cart load)</option>
                      <option value="large">Large (Truck load)</option>
                      <option value="massive">Massive (Multiple trucks)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">How long has it been there?</label>
                    <select
                      name="daysPresent"
                      className="form-select"
                      value={formData.daysPresent}
                      onChange={handleChange}
                    >
                      <option value="">Select duration</option>
                      <option value="today">Today</option>
                      <option value="few_days">Few days (2-5)</option>
                      <option value="week">About a week</option>
                      <option value="weeks">Several weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.category === 'toilet' && (
                <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#111827', fontSize: '18px' }}>Toilet Facility Details</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Type of Facility</label>
                    <select
                      name="toiletType"
                      className="form-select"
                      value={formData.toiletType}
                      onChange={handleChange}
                    >
                      <option value="">Select facility type</option>
                      <option value="public_toilet">Public Toilet</option>
                      <option value="community_toilet">Community Toilet Block</option>
                      <option value="sulabh">Sulabh Shauchalaya</option>
                      <option value="railway">Railway Station Toilet</option>
                      <option value="bus">Bus Stand Toilet</option>
                      <option value="park">Park Toilet</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Issues (Select all that apply)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {['Dirty/Uncleaned', 'No Water', 'Broken Fixtures', 'Foul Smell', 'No Lighting', 'Blocked Drain', 'No Door Lock', 'Not Accessible'].map(issue => (
                        <label key={issue} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            name="facilityIssue"
                            value={issue}
                            checked={formData.facilityIssue?.includes(issue)}
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span style={{ color: '#374151', fontSize: '14px' }}>{issue}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {formData.category === 'restaurant' && (
                <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#111827', fontSize: '18px' }}>Restaurant Details</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Restaurant/Establishment Name</label>
                    <input
                      type="text"
                      name="restaurantName"
                      className="form-input"
                      placeholder="Enter restaurant name"
                      value={formData.restaurantName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">FSSAI License Number (if visible)</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      className="form-input"
                      placeholder="Enter license number"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hygiene Issues (Select all that apply)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {['Dirty Kitchen', 'Pest Infestation', 'Food Storage Issues', 'Unhygienic Staff', 'Dirty Utensils', 'No Hand Washing', 'Expired Ingredients', 'Poor Ventilation'].map(issue => (
                        <label key={issue} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            name="hygieneIssue"
                            value={issue}
                            checked={formData.hygieneIssue?.includes(issue)}
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span style={{ color: '#374151', fontSize: '14px' }}>{issue}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {formData.category === 'water' && (
                <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#111827', fontSize: '18px' }}>Water Quality Details</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Water Source</label>
                    <select
                      name="waterSource"
                      className="form-select"
                      value={formData.waterSource}
                      onChange={handleChange}
                    >
                      <option value="">Select water source</option>
                      <option value="tap">Tap Water</option>
                      <option value="well">Well/Borewell</option>
                      <option value="tank">Water Tank</option>
                      <option value="pond">Pond</option>
                      <option value="lake">Lake</option>
                      <option value="puddle">Stagnant Puddle</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.category === 'beach' && (
                <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#111827', fontSize: '18px' }}>Pollution Details</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Type of Pollution</label>
                    <select
                      name="pollutionType"
                      className="form-select"
                      value={formData.pollutionType}
                      onChange={handleChange}
                    >
                      <option value="">Select pollution type</option>
                      <option value="plastic">Plastic Waste</option>
                      <option value="sewage">Sewage Discharge</option>
                      <option value="industrial">Industrial Waste</option>
                      <option value="oil">Oil Spill</option>
                      <option value="debris">General Debris</option>
                      <option value="algae">Algae Bloom</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Vehicle Number (Optional for all categories) */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Vehicle Number (Optional - if applicable)</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  className="form-input"
                  placeholder="e.g., DL 01 AB 1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                />
                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                  For issues involving vehicles (illegal dumping, mobile food carts, etc.)
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select
                  name="severity"
                  className="form-select"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Needs attention</option>
                  <option value="high">High - Urgent issue</option>
                  <option value="critical">Critical - Health hazard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={20} color="#10b981" />
                  Upload Images (Max 5)
                </label>
                <div 
                  className="image-upload-area"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '3px dashed #10b981' : '2px dashed #e5e7eb',
                    backgroundColor: dragActive ? '#f0fdf4' : '#f9fafb',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="upload-label" style={{ cursor: 'pointer', padding: '40px', textAlign: 'center' }}>
                    <Camera size={48} color="#10b981" style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {dragActive ? 'Drop images here' : 'Click or drag images here'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      PNG, JPG, JPEG (Max 5 images, 5MB each)
                    </div>
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {imagePreviews.length} / 5 images uploaded
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImages([]);
                          setImagePreviews([]);
                          toast.info('All images removed');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Remove all
                      </button>
                    </div>
                    <div className="image-previews" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                      gap: '12px' 
                    }}>
                      {imagePreviews.map((preview, index) => (
                        <div 
                          key={index} 
                          className="image-preview"
                          style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            aspectRatio: '1',
                            cursor: 'pointer',
                            border: '2px solid #e5e7eb',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => setSelectedImageIndex(index)}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        >
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <button
                            type="button"
                            className="remove-image"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              backgroundColor: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            ×
                          </button>
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview Modal */}
              <AnimatePresence>
                {selectedImageIndex !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px'
                    }}
                    onClick={() => setSelectedImageIndex(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      style={{
                        position: 'relative',
                        maxWidth: '90%',
                        maxHeight: '90%'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={imagePreviews[selectedImageIndex]}
                        alt={`Full view ${selectedImageIndex + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '90vh',
                          borderRadius: '12px'
                        }}
                      />
                      <button
                        onClick={() => setSelectedImageIndex(null)}
                        style={{
                          position: 'absolute',
                          top: '-40px',
                          right: '0',
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '24px'
                        }}
                      >
                        ×
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: '-40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {selectedImageIndex + 1} / {imagePreviews.length}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <MapPin size={20} color="#10b981" />
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>Pinpoint Exact Location</span>
                </label>
                
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertCircle size={20} color="#10b981" />
                  <div style={{ fontSize: '14px', color: '#047857' }}>
                    <strong>Tip:</strong> Use search to find location, click on map to mark exact spot, or use your current location
                  </div>
                </div>

                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  marginBottom: '16px'
                }}>
                  <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '450px', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <MapController position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  <div>
                    <strong style={{ color: '#6b7280' }}>Latitude:</strong>
                    <div style={{ color: '#111827', fontFamily: 'monospace' }}>{position[0].toFixed(6)}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280' }}>Longitude:</strong>
                    <div style={{ color: '#111827', fontFamily: 'monospace' }}>{position[1].toFixed(6)}</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Address *</label>
                <textarea
                  name="address"
                  className="form-textarea"
                  placeholder="Enter complete address with building/house number, street, area, city, pincode"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  style={{
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  className="form-input"
                  placeholder="e.g., Near Central Park, Opposite City Mall, Behind Police Station"
                  value={formData.landmark}
                  onChange={handleChange}
                />
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Help us locate faster by mentioning a well-known landmark
                </small>
              </div>

              <div className="button-group">
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(2)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ← Back
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: loading ? '#9ca3af' : '#10b981',
                    position: 'relative'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTop: '3px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>

      {/* Voice Input Modal */}
      {showVoiceModal && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowVoiceModal(false)}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVoiceModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={24} color="#6b7280" />
            </button>

            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '20px',
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827'
            }}>
              Voice Description
            </h3>

            <VoiceInput
              onChange={handleVoiceInput}
              isGlobalAILoading={isGlobalAILoading}
              setGlobalAILoading={setGlobalAILoading}
              maxDurationSeconds={60}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedReportIssue;
