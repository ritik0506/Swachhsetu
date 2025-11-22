import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import api from "../utils/api";
import { 
  Trash2, 
  MapPin, 
  Clock, 
  Filter,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  X,
  ExternalLink,
  Navigation,
  Search,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare
} from "lucide-react";
import { toast } from 'react-toastify';
import "leaflet/dist/leaflet.css";
import "./WasteReport.css";

// Fix for default marker icons and create custom markers
import L from 'leaflet';

// Component to recenter map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const createCustomIcon = (status) => {
  const colors = {
    pending: '#f59e0b',
    'in-progress': '#3b82f6',
    resolved: '#10b981',
    default: '#6b7280'
  };
  
  const color = colors[status] || colors.default;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
          font-weight: bold;
        ">📍</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const WasteReport = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [mapCenter, setMapCenter] = useState([28.7041, 77.1025]); // Delhi coordinates
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchWasteReports();
  }, []);

  useEffect(() => {
    filterAndSortReports();
  }, [filter, reports, searchQuery, sortBy]);

  const fetchWasteReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports', {
        params: { category: 'waste' }
      });
      
      // Get reports array from response
      const reportsData = response.data.reports || response.data || [];
      
      // Filter for waste-related categories
      const wasteReports = reportsData.filter(report => 
        report.category && ['waste', 'beach', 'street', 'park'].includes(report.category)
      );
      
      setReports(wasteReports);
      
      // Set map center to first report location if available
      if (wasteReports.length > 0 && wasteReports[0].location && wasteReports[0].location.coordinates) {
        setMapCenter([
          wasteReports[0].location.coordinates[1],
          wasteReports[0].location.coordinates[0]
        ]);
      }
    } catch (error) {
      console.error('Error fetching waste reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortReports = () => {
    let filtered = [...reports];

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(report => report.status === filter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.title?.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query) ||
        report.location?.address?.toLowerCase().includes(query) ||
        report.userId?.name?.toLowerCase().includes(query) ||
        report.category?.toLowerCase().includes(query)
      );
    }

    // Sort reports
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => (priorityOrder[b.severity] || 0) - (priorityOrder[a.severity] || 0));
        break;
      case 'location':
        filtered.sort((a, b) => (a.location?.address || '').localeCompare(b.location?.address || ''));
        break;
      default:
        break;
    }

    setFilteredReports(filtered);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'resolved': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
  };

  const focusOnReport = (report) => {
    if (report.location && report.location.coordinates) {
      setMapCenter([
        report.location.coordinates[1],
        report.location.coordinates[0]
      ]);
      openDetailModal(report);
    }
  };

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedReport(null);
    setShowDetailModal(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = [position.coords.latitude, position.coords.longitude];
          setMapCenter(newCenter);
          toast.success('Map centered on your location!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please allow location access.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  if (loading) {
    return (
      <div className="waste-report-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading waste reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="waste-report-page">
      <div className="container">
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              <Trash2 size={36} />
            </div>
            <div className="header-content">
              <h1>Waste Dump Reports</h1>
              <p>Real-time waste management reports from your community</p>
            </div>
          </div>
          <div className="header-right">
            <div className="header-stats">
              <div className="stat-box">
                <span className="stat-number">{reports.length}</span>
                <span className="stat-label">Total Reports</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{reports.filter(r => r.status === 'pending').length}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{reports.filter(r => r.status === 'resolved').length}</span>
                <span className="stat-label">Resolved</span>
              </div>
            </div>
            <button className="refresh-btn" onClick={fetchWasteReports}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-title">
            <Filter size={18} />
            Filter by Status:
          </div>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({reports.length})
            </button>
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending ({reports.filter(r => r.status === 'pending').length})
            </button>
            <button 
              className={filter === 'in-progress' ? 'active' : ''}
              onClick={() => setFilter('in-progress')}
            >
              In Progress ({reports.filter(r => r.status === 'in-progress').length})
            </button>
            <button 
              className={filter === 'resolved' ? 'active' : ''}
              onClick={() => setFilter('resolved')}
            >
              Resolved ({reports.filter(r => r.status === 'resolved').length})
            </button>
          </div>
        </div>

        <div className="waste-content">
          <div className="map-section">
            <div className="map-header">
              <h3>
                <MapPin size={20} />
                Waste Locations Map
              </h3>
              <button 
                className="current-location-btn"
                onClick={getCurrentLocation}
                title="Go to my location"
              >
                <Navigation size={18} />
                My Location
              </button>
            </div>
            <MapContainer 
              center={mapCenter} 
              zoom={12} 
              style={{ height: '500px', width: '100%', borderRadius: '16px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <RecenterMap center={mapCenter} />
              {filteredReports.map((report) => (
                report.location && report.location.coordinates && (
                  <Marker
                    key={report._id}
                    position={[
                      report.location.coordinates[1],
                      report.location.coordinates[0]
                    ]}
                    icon={createCustomIcon(report.status)}
                    eventHandlers={{
                      click: () => openDetailModal(report)
                    }}
                  >
                    <Popup maxWidth={350}>
                      <div className="enhanced-map-popup">
                        <div className="popup-header">
                          <h4>{report.issueType}</h4>
                          <span 
                            className={`popup-status ${report.status}`}
                            style={{ backgroundColor: getStatusColor(report.status) }}
                          >
                            {report.status}
                          </span>
                        </div>
                        
                        {report.image && (
                          <div className="popup-image-container">
                            <img 
                              src={`http://localhost:5000${report.image}`}
                              alt={report.issueType}
                              className="popup-image"
                            />
                          </div>
                        )}
                        
                        <div className="popup-content">
                          <p className="popup-description">{report.description}</p>
                          
                          <div className="popup-details">
                            <div className="popup-detail-item">
                              <MapPin size={14} />
                              <span>{report.address || 'Location not specified'}</span>
                            </div>
                            <div className="popup-detail-item">
                              <User size={14} />
                              <span>{report.userId?.name || 'Anonymous'}</span>
                            </div>
                            <div className="popup-detail-item">
                              <Calendar size={14} />
                              <span>{new Date(report.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}</span>
                            </div>
                          </div>
                          
                          <button 
                            className="popup-view-btn"
                            onClick={() => openDetailModal(report)}
                          >
                            <ExternalLink size={14} />
                            View Full Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          <div className="reports-section">
            <div className="reports-header">
              <h3>
                <AlertTriangle size={20} />
                Reports List ({filteredReports.length})
              </h3>
              <div className="reports-controls">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">By Priority</option>
                  <option value="location">By Location</option>
                </select>
              </div>
            </div>
            
            {filteredReports.length > 0 ? (
              <div className="reports-grid">
                {filteredReports.map((report) => (
                  <div 
                    key={report._id} 
                    className="waste-report-card"
                    onClick={() => focusOnReport(report)}
                  >
                    {report.images && report.images.length > 0 && (
                      <div className="card-image">
                        <img 
                          src={`http://localhost:5000${report.images[0].url}`}
                          alt={report.title}
                        />
                        <div className="image-overlay">
                          <span className="severity-badge" style={{ backgroundColor: getSeverityColor(report.severity) }}>
                            {getSeverityIcon(report.severity)} {report.severity}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="card-content">
                      <div className="card-header">
                        <h4>{report.title || report.category}</h4>
                        <span 
                          className={`status-badge ${report.status}`}
                          style={{ backgroundColor: getStatusColor(report.status) }}
                        >
                          {report.status}
                        </span>
                      </div>
                      
                      <p className="description">{report.description}</p>
                      
                      <div className="report-stats">
                        <div className="stat-item">
                          <Eye size={14} />
                          <span>{report.views || 0}</span>
                        </div>
                        <div className="stat-item">
                          <ThumbsUp size={14} />
                          <span>{report.upvotes?.length || 0}</span>
                        </div>
                        <div className="stat-item">
                          <MessageSquare size={14} />
                          <span>{report.comments?.length || 0}</span>
                        </div>
                      </div>
                      
                      <div className="report-meta">
                        <div className="meta-item">
                          <MapPin size={14} />
                          <span>{report.location?.address || 'Location not specified'}</span>
                        </div>
                        <div className="meta-item">
                          <User size={14} />
                          <span>{report.userId?.name || 'Anonymous'}</span>
                        </div>
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>{getTimeSince(report.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="card-footer">
                        <span className="category-tag">
                          {report.category}
                        </span>
                        <button 
                          className="view-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(report);
                          }}
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reports">
                <Trash2 size={48} />
                <p>No waste reports found for the selected filter.</p>
                {searchQuery && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="report-modal-overlay" onClick={closeDetailModal}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h2>{selectedReport.issueType}</h2>
              <button className="modal-close-btn" onClick={closeDetailModal}>
                <X size={24} />
              </button>
            </div>

            <div className="report-modal-body">
              {selectedReport.image && (
                <div className="modal-image-section">
                  <img 
                    src={`http://localhost:5000${selectedReport.image}`}
                    alt={selectedReport.issueType}
                    className="modal-report-image"
                  />
                </div>
              )}

              <div className="modal-details-grid">
                <div className="modal-detail-card">
                  <label>Status</label>
                  <span 
                    className={`modal-status-badge ${selectedReport.status}`}
                    style={{ backgroundColor: getStatusColor(selectedReport.status) }}
                  >
                    {selectedReport.status}
                  </span>
                </div>

                <div className="modal-detail-card">
                  <label>Report ID</label>
                  <span className="modal-id">{selectedReport._id}</span>
                </div>

                <div className="modal-detail-card">
                  <label>Reported By</label>
                  <div className="reporter-info-modal">
                    <User size={16} />
                    <span>{selectedReport.userId?.name || 'Anonymous'}</span>
                  </div>
                </div>

                <div className="modal-detail-card">
                  <label>Date Reported</label>
                  <div className="date-info">
                    <Calendar size={16} />
                    <span>{new Date(selectedReport.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>

                <div className="modal-detail-card full-width">
                  <label>Location</label>
                  <div className="location-info">
                    <MapPin size={16} />
                    <span>{selectedReport.address || 'Location not specified'}</span>
                  </div>
                  {selectedReport.location && (
                    <div className="coordinates">
                      Lat: {selectedReport.location.coordinates[1].toFixed(6)}, 
                      Lng: {selectedReport.location.coordinates[0].toFixed(6)}
                    </div>
                  )}
                </div>

                <div className="modal-detail-card full-width">
                  <label>Description</label>
                  <p className="modal-description">{selectedReport.description}</p>
                </div>

                {selectedReport.resolvedAt && (
                  <div className="modal-detail-card">
                    <label>Resolved At</label>
                    <div className="date-info">
                      <Clock size={16} />
                      <span>{new Date(selectedReport.resolvedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteReport;
