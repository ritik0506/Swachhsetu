import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Settings,
  Search,
  Filter,
  Download,
  Eye,
  X,
  MapPin,
  Calendar,
  User,
  Image as ImageIcon,
  MessageSquare,
  Map
} from 'lucide-react';
import { adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import WasteDumpMap from '../components/WasteDumpMap';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    severity: '',
    search: ''
  });

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'moderator')) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes] = await Promise.all([
        adminAPI.getStatistics(),
        adminAPI.getAllReports({ limit: 50 })
      ]);

      setStats(statsRes.data.statistics);
      setReports(reportsRes.data.reports);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({ limit: 100 });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await adminAPI.updateReport(reportId, { status: newStatus });
      toast.success('Report status updated!');
      fetchAdminData();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update report');
    }
  };

  const handleBulkUpdate = async (status) => {
    if (selectedReports.length === 0) {
      toast.warning('Please select reports first');
      return;
    }

    try {
      await adminAPI.bulkUpdateReports({
        reportIds: selectedReports,
        status
      });
      toast.success(`${selectedReports.length} reports updated!`);
      setSelectedReports([]);
      fetchAdminData();
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast.error('Failed to update reports');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await adminAPI.deleteReport(reportId);
      toast.success('Report deleted successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete report');
    }
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('User role updated!');
      fetchUsers();
    } catch (error) {
      console.error('Role update failed:', error);
      toast.error('Failed to update user role');
    }
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const filteredReports = reports.filter(report => {
    if (filters.status && report.status !== filters.status) return false;
    if (filters.category && report.category !== filters.category) return false;
    if (filters.severity && report.severity !== filters.severity) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        report.title.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.location?.address?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="admin-access-denied">
        <Shield size={64} />
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Enhanced Header */}
      <div className="admin-header">
        <div className="header-left">
          <div className="header-icon">
            <Shield size={36} />
          </div>
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, <span className="user-highlight">{user.name}</span> • <span className="role-badge">{user.role}</span></p>
          </div>
        </div>
        <div className="header-right">
          {stats && (
            <div className="header-stats">
              <div className="stat-box pending">
                <Clock size={20} />
                <div>
                  <span className="stat-number">{stats.overview.pendingReports}</span>
                  <span className="stat-label">Pending</span>
                </div>
              </div>
              <div className="stat-box progress">
                <Settings size={20} />
                <div>
                  <span className="stat-number">{stats.overview.inProgressReports}</span>
                  <span className="stat-label">In Progress</span>
                </div>
              </div>
              <div className="stat-box resolved">
                <CheckCircle size={20} />
                <div>
                  <span className="stat-number">{stats.overview.resolvedReports}</span>
                  <span className="stat-label">Resolved</span>
                </div>
              </div>
            </div>
          )}
          <button className="refresh-btn" onClick={fetchAdminData}>
            <Download size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={18} />
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={18} />
          Manage Reports
        </button>
        <button
          className={`tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <Map size={18} />
          Waste Dump Map
        </button>
        {user.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              fetchUsers();
            }}
          >
            <Users size={18} />
            Manage Users
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overview-content"
        >
          {/* Stats Cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card pending">
              <Clock size={32} />
              <div className="stat-info">
                <h3>{stats.overview.pendingReports}</h3>
                <p>Pending Reports</p>
              </div>
            </div>
            <div className="admin-stat-card progress">
              <Settings size={32} />
              <div className="stat-info">
                <h3>{stats.overview.inProgressReports}</h3>
                <p>In Progress</p>
              </div>
            </div>
            <div className="admin-stat-card resolved">
              <CheckCircle size={32} />
              <div className="stat-info">
                <h3>{stats.overview.resolvedReports}</h3>
                <p>Resolved</p>
              </div>
            </div>
            <div className="admin-stat-card users">
              <Users size={32} />
              <div className="stat-info">
                <h3>{stats.overview.activeUsers}/{stats.overview.totalUsers}</h3>
                <p>Active Users</p>
              </div>
            </div>
          </div>

          {/* Critical Reports */}
          {stats.criticalReports && stats.criticalReports.length > 0 && (
            <div className="critical-reports-section">
              <h3>
                <AlertTriangle size={24} color="#ef4444" />
                Critical Reports Requiring Attention
              </h3>
              <div className="critical-reports-list">
                {stats.criticalReports.map(report => (
                  <div key={report._id} className="critical-report-item">
                    <div className="report-info">
                      <h4>{report.title}</h4>
                      <p>{report.description.substring(0, 100)}...</p>
                      <span className="report-meta">
                        By: {report.userId?.name} • {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <select
                      value={report.status}
                      onChange={(e) => handleUpdateStatus(report._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Contributors */}
          {stats.topReporters && (
            <div className="top-contributors">
              <h3>Top Contributors This Month</h3>
              <div className="contributors-list">
                {stats.topReporters.map((reporter, index) => (
                  <div key={index} className="contributor-item">
                    <span className="rank">#{index + 1}</span>
                    <img
                      src={reporter._id?.avatar || `https://ui-avatars.com/api/?name=${reporter._id?.name}`}
                      alt={reporter._id?.name}
                      className="contributor-avatar"
                    />
                    <div className="contributor-info">
                      <strong>{reporter._id?.name}</strong>
                      <span>{reporter.reportCount} reports</span>
                    </div>
                    <span className="contributor-points">
                      {reporter._id?.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Reports Management Tab */}
      {activeTab === 'reports' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="reports-management"
        >
          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedReports.length} selected</span>
              <button onClick={() => handleBulkUpdate('in-progress')} className="btn-bulk">
                Mark In Progress
              </button>
              <button onClick={() => handleBulkUpdate('resolved')} className="btn-bulk">
                Mark Resolved
              </button>
              <button onClick={() => setSelectedReports([])} className="btn-bulk">
                Clear Selection
              </button>
            </div>
          )}

          {/* Reports Table */}
          <div className="reports-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReports(filteredReports.map(r => r._id));
                        } else {
                          setSelectedReports([]);
                        }
                      }}
                    />
                  </th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Reporter</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report._id)}
                        onChange={() => toggleReportSelection(report._id)}
                      />
                    </td>
                    <td className="report-title">{report.title}</td>
                    <td>
                      <span className="badge badge-info">{report.category}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${report.severity === 'critical' ? 'danger' : report.severity === 'high' ? 'warning' : 'info'}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td>{report.userId?.name}</td>
                    <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={report.status}
                        onChange={(e) => handleUpdateStatus(report._id, e.target.value)}
                        className={`status-badge status-${report.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => viewReportDetails(report)}
                          className="btn-view"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteReport(report._id)}
                            className="btn-delete"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Waste Dump Map Tab */}
      {activeTab === 'map' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="map-tab-content"
        >
          <WasteDumpMap />
        </motion.div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && user.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="users-management"
        >
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Level</th>
                  <th>Points</th>
                  <th>Reports</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                          alt={user.name}
                          className="user-avatar-small"
                        />
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`role-badge role-${user.role}`}
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>Level {user.level}</td>
                    <td>{user.points} pts</td>
                    <td>{user.reportsSubmitted}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-sm" title="View Profile">
                        👤
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Report Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReport && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetailModal}
          >
            <motion.div
              className="report-detail-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <h2>Report Details</h2>
                <button onClick={closeDetailModal} className="close-btn">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="modal-content">
                {/* Report Info Section */}
                <div className="detail-section">
                  <div className="section-header">
                    <FileText size={20} />
                    <h3>Report Information</h3>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Title</label>
                      <p className="detail-value">{selectedReport.title}</p>
                    </div>
                    <div className="detail-item">
                      <label>Issue Type</label>
                      <p className="detail-value">{selectedReport.issueType || selectedReport.category}</p>
                    </div>
                    <div className="detail-item">
                      <label>Category</label>
                      <span className="badge badge-info">{selectedReport.category}</span>
                    </div>
                    <div className="detail-item">
                      <label>Severity</label>
                      <span className={`badge badge-${selectedReport.severity === 'critical' ? 'danger' : selectedReport.severity === 'high' ? 'warning' : 'info'}`}>
                        {selectedReport.severity}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <span className={`badge badge-${selectedReport.status}`}>{selectedReport.status}</span>
                    </div>
                    <div className="detail-item">
                      <label>Report ID</label>
                      <p className="detail-value detail-id">{selectedReport._id}</p>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div className="detail-section">
                  <div className="section-header">
                    <MessageSquare size={20} />
                    <h3>Description</h3>
                  </div>
                  <p className="description-text">{selectedReport.description}</p>
                </div>

                {/* Location Section */}
                <div className="detail-section">
                  <div className="section-header">
                    <MapPin size={20} />
                    <h3>Location Details</h3>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item full-width">
                      <label>Address</label>
                      <p className="detail-value">{selectedReport.location?.address || 'Not provided'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Coordinates</label>
                      <p className="detail-value">
                        {selectedReport.location?.coordinates?.[1]?.toFixed(6)}, {selectedReport.location?.coordinates?.[0]?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reporter Section */}
                <div className="detail-section">
                  <div className="section-header">
                    <User size={20} />
                    <h3>Reporter Information</h3>
                  </div>
                  <div className="reporter-info">
                    <img
                      src={selectedReport.userId?.avatar || `https://ui-avatars.com/api/?name=${selectedReport.userId?.name}`}
                      alt={selectedReport.userId?.name}
                      className="reporter-avatar"
                    />
                    <div className="reporter-details">
                      <p className="reporter-name">{selectedReport.userId?.name}</p>
                      <p className="reporter-email">{selectedReport.userId?.email}</p>
                      <p className="reporter-meta">Level {selectedReport.userId?.level} • {selectedReport.userId?.points} points</p>
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="detail-section">
                  <div className="section-header">
                    <Calendar size={20} />
                    <h3>Timeline</h3>
                  </div>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <p className="timeline-label">Created</p>
                        <p className="timeline-value">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <p className="timeline-label">Last Updated</p>
                        <p className="timeline-value">{new Date(selectedReport.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedReport.resolvedAt && (
                      <div className="timeline-item">
                        <div className="timeline-dot resolved"></div>
                        <div className="timeline-content">
                          <p className="timeline-label">Resolved</p>
                          <p className="timeline-value">{new Date(selectedReport.resolvedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images Section */}
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div className="detail-section">
                    <div className="section-header">
                      <ImageIcon size={20} />
                      <h3>Attached Images ({selectedReport.images.length})</h3>
                    </div>
                    <div className="images-grid">
                      {selectedReport.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Report ${idx + 1}`}
                          className="report-image"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Section */}
                <div className="modal-actions">
                  <select
                    value={selectedReport.status}
                    onChange={(e) => {
                      handleUpdateStatus(selectedReport._id, e.target.value);
                      setSelectedReport({ ...selectedReport, status: e.target.value });
                    }}
                    className="status-select-modal"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        handleDeleteReport(selectedReport._id);
                        closeDetailModal();
                      }}
                      className="btn-danger"
                    >
                      Delete Report
                    </button>
                  )}
                  <button onClick={closeDetailModal} className="btn-secondary">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
