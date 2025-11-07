import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import api from "../utils/api";
import { 
  Trash2, 
  MapPin, 
  Clock, 
  Filter,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./WasteReport.css";

// Fix for default marker icons in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WasteReport = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [mapCenter, setMapCenter] = useState([28.7041, 77.1025]); // Delhi coordinates

  useEffect(() => {
    fetchWasteReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [filter, reports]);

  const fetchWasteReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      const wasteReports = response.data.filter(report => 
        report.issueType && report.issueType.toLowerCase().includes('waste')
      );
      setReports(wasteReports);
      
      // Set map center to first report location if available
      if (wasteReports.length > 0 && wasteReports[0].location) {
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

  const filterReports = () => {
    if (filter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.status === filter));
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'resolved': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
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
          <div className="header-content">
            <h1>
              <Trash2 size={32} />
              Waste Dump Reports
            </h1>
            <p>Real-time waste management reports from your community</p>
          </div>
          <button className="refresh-btn" onClick={fetchWasteReports}>
            <RefreshCw size={18} />
            Refresh
          </button>
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
            <h3>
              <MapPin size={20} />
              Waste Locations Map
            </h3>
            <MapContainer 
              center={mapCenter} 
              zoom={12} 
              style={{ height: '500px', width: '100%', borderRadius: '16px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredReports.map((report) => (
                report.location && report.location.coordinates && (
                  <Marker
                    key={report._id}
                    position={[
                      report.location.coordinates[1],
                      report.location.coordinates[0]
                    ]}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h4>{report.issueType}</h4>
                        <p>{report.description}</p>
                        <span className={`status-badge ${report.status}`}>
                          {report.status}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          <div className="reports-section">
            <h3>
              <AlertTriangle size={20} />
              Reports List ({filteredReports.length})
            </h3>
            {filteredReports.length > 0 ? (
              <div className="reports-grid">
                {filteredReports.map((report) => (
                  <div key={report._id} className="waste-report-card">
                    <div className="card-header">
                      <span 
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(report.status) }}
                      ></span>
                      <h4>{report.issueType}</h4>
                    </div>
                    <div className="card-body">
                      <p className="description">{report.description}</p>
                      <div className="report-meta">
                        <span className="location">
                          <MapPin size={14} />
                          {report.address || 'Location not specified'}
                        </span>
                        <span className="time">
                          <Clock size={14} />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {report.image && (
                        <img 
                          src={`http://localhost:5000${report.image}`}
                          alt={report.issueType}
                          className="report-image"
                        />
                      )}
                    </div>
                    <div className="card-footer">
                      <span className={`status-badge ${report.status}`}>
                        {report.status}
                      </span>
                      <span className="reported-by">
                        Reported by: {report.userId?.name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reports">
                <Trash2 size={48} />
                <p>No waste reports found for the selected filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteReport;
