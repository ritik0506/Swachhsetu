import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  X,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  Navigation
} from 'lucide-react';
import { adminAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './WasteDumpMap.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom marker icons based on status and severity
const createCustomIcon = (status, severity) => {
  let color = '#f59e0b'; // default orange
  
  if (status === 'resolved') {
    color = '#10b981'; // green
  } else if (status === 'in-progress') {
    color = '#3b82f6'; // blue
  } else if (severity === 'critical') {
    color = '#ef4444'; // red
  } else if (severity === 'high') {
    color = '#f59e0b'; // orange
  }

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); font-size: 18px;">
          ${severity === 'critical' ? '⚠️' : status === 'resolved' ? '✓' : '📍'}
        </div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Component to recenter map when reports change
const MapController = ({ reports }) => {
  const map = useMap();

  useEffect(() => {
    if (reports && reports.length > 0) {
      const bounds = reports.map(report => [
        report.location.coordinates[1],
        report.location.coordinates[0]
      ]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [reports, map]);

  return null;
};

const WasteDumpMap = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    severity: ''
  });

  const defaultCenter = [12.9716, 77.5946]; // Bangalore coordinates

  useEffect(() => {
    fetchWasteDumpData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, reports]);

  const fetchWasteDumpData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getWasteDumpMapData();
      setReports(response.data.reports);
      setFilteredReports(response.data.reports);
      setStats(response.data.stats);
      toast.success('Waste dump data loaded successfully');
    } catch (error) {
      console.error('Failed to fetch waste dump data:', error);
      toast.error('Failed to load waste dump map data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(report => report.category === filters.category);
    }

    if (filters.severity) {
      filtered = filtered.filter(report => report.severity === filters.severity);
    }

    setFilteredReports(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', category: '', severity: '' });
  };

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await adminAPI.updateReport(reportId, { status: newStatus });
      toast.success('Report status updated successfully');
      fetchWasteDumpData();
      closeDetailModal();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update report status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge-pending';
      case 'in-progress':
        return 'status-badge-progress';
      case 'resolved':
        return 'status-badge-resolved';
      default:
        return 'status-badge-default';
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'critical':
        return 'severity-badge-critical';
      case 'high':
        return 'severity-badge-high';
      case 'medium':
        return 'severity-badge-medium';
      case 'low':
        return 'severity-badge-low';
      default:
        return 'severity-badge-default';
    }
  };

  if (loading) {
    return (
      <div className="waste-dump-map-loading">
        <div className="loading-spinner"></div>
        <p>Loading waste dump locations...</p>
      </div>
    );
  }

  return (
    <div className="waste-dump-map-container">
      {/* Header with Stats */}
      <div className="map-header">
        <div className="map-header-content">
          <h2>
            <MapPin size={24} />
            Waste Dump Monitoring Map
          </h2>
          <p>{filteredReports.length} waste dump reports on map</p>
        </div>
        
        <div className="map-header-actions">
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
          <button 
            className="refresh-btn"
            onClick={fetchWasteDumpData}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="map-stats-bar">
          <div className="stat-card">
            <AlertTriangle size={20} className="stat-icon pending" />
            <div className="stat-content">
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={20} className="stat-icon progress" />
            <div className="stat-content">
              <span className="stat-value">{stats.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          <div className="stat-card">
            <CheckCircle size={20} className="stat-icon resolved" />
            <div className="stat-content">
              <span className="stat-value">{stats.resolved}</span>
              <span className="stat-label">Resolved</span>
            </div>
          </div>
          <div className="stat-card">
            <MapPin size={20} className="stat-icon total" />
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Reports</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="waste">Waste</option>
              <option value="beach">Beach</option>
              <option value="street">Street</option>
              <option value="park">Park</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Severity</label>
            <select 
              value={filters.severity} 
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="map-wrapper">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="waste-dump-leaflet-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapController reports={filteredReports} />

          {filteredReports.map((report) => (
            <Marker
              key={report._id}
              position={[report.location.coordinates[1], report.location.coordinates[0]]}
              icon={createCustomIcon(report.status, report.severity)}
              eventHandlers={{
                click: () => openDetailModal(report)
              }}
            >
              <Popup maxWidth={350} className="admin-map-popup">
                <div className="popup-header">
                  <h4>{report.title}</h4>
                  <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                
                {report.images && report.images.length > 0 && (
                  <div className="popup-image-container">
                    <img 
                      src={`http://localhost:5000${report.images[0].url}`} 
                      alt={report.title}
                      className="popup-image"
                    />
                  </div>
                )}

                <div className="popup-content">
                  <p className="popup-description">{report.description}</p>
                  
                  <div className="popup-details">
                    <div className="popup-detail-item">
                      <MapPin size={16} />
                      <span>{report.location.address || 'Location marked'}</span>
                    </div>
                    
                    <div className="popup-detail-item">
                      <User size={16} />
                      <span>{report.userId?.name || 'Anonymous'}</span>
                    </div>
                    
                    <div className="popup-detail-item">
                      <Calendar size={16} />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="popup-detail-item">
                      <AlertTriangle size={16} />
                      <span className={`severity-badge ${getSeverityBadgeClass(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>
                  </div>

                  <button 
                    className="popup-view-detail-btn"
                    onClick={() => openDetailModal(report)}
                  >
                    View Full Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="admin-modal-overlay" onClick={closeDetailModal}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Report Details</h2>
              <button className="modal-close-btn" onClick={closeDetailModal}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Images Section */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="modal-images-section">
                  <h3><ImageIcon size={18} /> Images</h3>
                  <div className="modal-images-grid">
                    {selectedReport.images.map((image, index) => (
                      <img 
                        key={index}
                        src={`http://localhost:5000${image.url}`}
                        alt={`Report ${index + 1}`}
                        className="modal-report-image"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="modal-details-grid">
                <div className="modal-detail-card">
                  <h4>Report ID</h4>
                  <p className="report-id">{selectedReport._id}</p>
                </div>

                <div className="modal-detail-card">
                  <h4>Status</h4>
                  <span className={`status-badge-modal ${selectedReport.status}`}>
                    {selectedReport.status}
                  </span>
                </div>

                <div className="modal-detail-card">
                  <h4>Severity</h4>
                  <span className={`severity-badge-modal ${selectedReport.severity}`}>
                    {selectedReport.severity}
                  </span>
                </div>

                <div className="modal-detail-card">
                  <h4>Category</h4>
                  <p>{selectedReport.category}</p>
                </div>

                <div className="modal-detail-card">
                  <h4>Reporter</h4>
                  <div className="reporter-info-modal">
                    <div className="reporter-avatar-modal">
                      {selectedReport.userId?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="reporter-details-modal">
                      <p>{selectedReport.userId?.name || 'Anonymous'}</p>
                      <p>{selectedReport.userId?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="modal-detail-card">
                  <h4>Reported Date</h4>
                  <div className="date-info">
                    <Calendar size={16} />
                    <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="modal-detail-card full-width">
                  <h4>Location</h4>
                  <div className="location-info">
                    <MapPin size={16} />
                    <span>{selectedReport.location.address || 'No address provided'}</span>
                  </div>
                  <div className="coordinates">
                    <Navigation size={14} />
                    <span>Lat: {selectedReport.location.coordinates[1].toFixed(6)}</span>
                    <span>Lng: {selectedReport.location.coordinates[0].toFixed(6)}</span>
                  </div>
                </div>

                <div className="modal-detail-card full-width">
                  <h4>Description</h4>
                  <p className="description-text">{selectedReport.description}</p>
                </div>

                {selectedReport.resolvedAt && (
                  <div className="modal-detail-card full-width">
                    <h4>Resolved Date</h4>
                    <div className="date-info">
                      <CheckCircle size={16} />
                      <span>{new Date(selectedReport.resolvedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="modal-actions">
                <label htmlFor="status-update">Update Status:</label>
                <select 
                  id="status-update"
                  value={selectedReport.status}
                  onChange={(e) => handleStatusUpdate(selectedReport._id, e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteDumpMap;
