import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Trophy, 
  Edit2,
  Save,
  X,
  MapPin,
  Lock,
  Camera,
  Award,
  Activity,
  BarChart3,
  Settings,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { authAPI, reportAPI } from '../utils/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, points: 0 });
  const [achievements, setAchievements] = useState([]);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        email: user.email,
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
      });
      fetchUserStats();
      fetchAchievements();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await reportAPI.getMyReports();
      const reports = response.data.reports || [];
      setStats({
        total: reports.length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        pending: reports.filter(r => r.status === 'pending').length,
        points: user.points || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAchievements = () => {
    const userAchievements = [];
    const points = user.points || 0;
    
    if (points >= 10) userAchievements.push({ name: 'Beginner', icon: '🌱', desc: 'Earned 10+ points' });
    if (points >= 50) userAchievements.push({ name: 'Contributor', icon: '⭐', desc: 'Earned 50+ points' });
    if (points >= 100) userAchievements.push({ name: 'Expert', icon: '🏆', desc: 'Earned 100+ points' });
    if (stats.total >= 5) userAchievements.push({ name: 'Reporter', icon: '📝', desc: 'Submitted 5+ reports' });
    if (stats.resolved >= 3) userAchievements.push({ name: 'Problem Solver', icon: '✅', desc: '3+ reports resolved' });
    
    setAchievements(userAchievements);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(formData);
      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      phone: user.phone || '',
      email: user.email,
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || ''
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.updateProfile({ 
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword 
      });
      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-banner">
            <div className="banner-gradient"></div>
          </div>
          <div className="profile-info-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button className="avatar-upload-btn" title="Change Avatar">
                <Camera size={16} />
              </button>
            </div>
            <div className="profile-title">
              <h1>{user.name}</h1>
              <div className="profile-badges">
                <span className="role-badge" style={{ 
                  background: user.role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 
                             user.role === 'moderator' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                             'linear-gradient(135deg, #10b981, #059669)'
                }}>
                  <Shield size={14} />
                  {user.role}
                </span>
                <span className="points-badge">
                  <Trophy size={14} />
                  {stats.points} Points
                </span>
                <span className="level-badge">
                  <Award size={14} />
                  Level {Math.floor(stats.points / 10) || 1}
                </span>
              </div>
              <p className="profile-bio">Making our community cleaner, one report at a time! 🌱</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-overview">
          <div className="stat-card-mini">
            <div className="stat-icon-wrapper reports">
              <BarChart3 size={24} />
            </div>
            <div className="stat-details">
              <h3>{stats.total}</h3>
              <p>Total Reports</p>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon-wrapper resolved">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-details">
              <h3>{stats.resolved}</h3>
              <p>Resolved</p>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon-wrapper pending">
              <Activity size={24} />
            </div>
            <div className="stat-details">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon-wrapper achievements">
              <Award size={24} />
            </div>
            <div className="stat-details">
              <h3>{achievements.length}</h3>
              <p>Achievements</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <User size={18} />
            Personal Info
          </button>
          <button 
            className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <Award size={18} />
            Achievements
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            Security
          </button>
          <button 
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Settings size={18} />
            Preferences
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="personal-info-container">
              {/* Header Section */}
              <div className="info-header-card">
                <div className="info-header-content">
                  <div className="header-icon-wrapper">
                    <User size={32} />
                  </div>
                  <div>
                    <h2>Personal Information</h2>
                    <p>Manage your personal details and contact information</p>
                  </div>
                </div>
                {!isEditing ? (
                  <button className="edit-btn-modern" onClick={() => setIsEditing(true)}>
                    <Edit2 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions-modern">
                    <button 
                      className="save-btn-modern" 
                      onClick={handleSave}
                      disabled={loading}
                    >
                      <Save size={18} />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="cancel-btn-modern" onClick={handleCancel}>
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Basic Information Section */}
              <div className="info-section-card">
                <div className="section-header">
                  <div className="section-icon">
                    <User size={20} />
                  </div>
                  <h3>Basic Information</h3>
                </div>
                <div className="info-grid-modern">
                  <div className="info-field">
                    <label className="field-label">
                      <User size={16} />
                      Full Name
                    </label>
                    {isEditing ? (
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="modern-input"
                          placeholder="Enter your full name"
                        />
                      </div>
                    ) : (
                      <div className="field-value">{user.name}</div>
                    )}
                  </div>

                  <div className="info-field">
                    <label className="field-label">
                      <Mail size={16} />
                      Email Address
                    </label>
                    <div className="field-value with-badge">
                      {user.email}
                      <span className="verified-badge">
                        <CheckCircle2 size={14} />
                        Verified
                      </span>
                    </div>
                    <span className="field-hint">Your email address is verified and cannot be changed</span>
                  </div>

                  <div className="info-field">
                    <label className="field-label">
                      <Phone size={16} />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div className="input-wrapper">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="modern-input"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    ) : (
                      <div className="field-value">{user.phone || <span className="empty-value">Not provided</span>}</div>
                    )}
                  </div>

                  <div className="info-field">
                    <label className="field-label">
                      <Calendar size={16} />
                      Member Since
                    </label>
                    <div className="field-value">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      <span className="membership-duration">
                        ({Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} days)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="info-section-card">
                <div className="section-header">
                  <div className="section-icon">
                    <MapPin size={20} />
                  </div>
                  <h3>Address Information</h3>
                </div>
                <div className="info-grid-modern">
                  <div className="info-field full-width">
                    <label className="field-label">
                      <MapPin size={16} />
                      Street Address
                    </label>
                    {isEditing ? (
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="modern-input"
                          placeholder="Enter your street address"
                        />
                      </div>
                    ) : (
                      <div className="field-value">{user.address || <span className="empty-value">Not provided</span>}</div>
                    )}
                  </div>

                  <div className="info-field">
                    <label className="field-label">
                      City
                    </label>
                    {isEditing ? (
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="modern-input"
                          placeholder="City"
                        />
                      </div>
                    ) : (
                      <div className="field-value">{user.city || <span className="empty-value">Not provided</span>}</div>
                    )}
                  </div>

                  <div className="info-field">
                    <label className="field-label">
                      State / Province
                    </label>
                    {isEditing ? (
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="modern-input"
                          placeholder="State"
                        />
                      </div>
                    ) : (
                      <div className="field-value">{user.state || <span className="empty-value">Not provided</span>}</div>
                    )}
                  </div>

                  <div className="info-field">
                    <label className="field-label">
                      Postal Code
                    </label>
                    {isEditing ? (
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          className="modern-input"
                          placeholder="000000"
                          maxLength="6"
                        />
                      </div>
                    ) : (
                      <div className="field-value">{user.pincode || <span className="empty-value">Not provided</span>}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Stats Section */}
              <div className="info-section-card account-stats">
                <div className="section-header">
                  <div className="section-icon">
                    <BarChart3 size={20} />
                  </div>
                  <h3>Account Statistics</h3>
                </div>
                <div className="stats-grid-mini">
                  <div className="stat-mini-card">
                    <div className="stat-mini-icon blue">
                      <Trophy size={20} />
                    </div>
                    <div className="stat-mini-info">
                      <p className="stat-mini-label">Total Points</p>
                      <h4 className="stat-mini-value">{stats.points}</h4>
                    </div>
                  </div>
                  <div className="stat-mini-card">
                    <div className="stat-mini-icon green">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="stat-mini-info">
                      <p className="stat-mini-label">Reports Resolved</p>
                      <h4 className="stat-mini-value">{stats.resolved}</h4>
                    </div>
                  </div>
                  <div className="stat-mini-card">
                    <div className="stat-mini-icon purple">
                      <Award size={20} />
                    </div>
                    <div className="stat-mini-info">
                      <p className="stat-mini-label">Current Level</p>
                      <h4 className="stat-mini-value">{Math.floor(stats.points / 10) || 1}</h4>
                    </div>
                  </div>
                  <div className="stat-mini-card">
                    <div className="stat-mini-icon orange">
                      <Activity size={20} />
                    </div>
                    <div className="stat-mini-info">
                      <p className="stat-mini-label">Active Reports</p>
                      <h4 className="stat-mini-value">{stats.pending}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="profile-card-full">
              <div className="card-header">
                <h2>Your Achievements</h2>
                <span className="achievement-count">{achievements.length} Unlocked</span>
              </div>
              <div className="achievements-grid">
                {achievements.length > 0 ? (
                  achievements.map((achievement, index) => (
                    <div key={index} className="achievement-card unlocked">
                      <div className="achievement-icon">{achievement.icon}</div>
                      <h3>{achievement.name}</h3>
                      <p>{achievement.desc}</p>
                      <span className="achievement-status">Unlocked</span>
                    </div>
                  ))
                ) : (
                  <div className="no-achievements">
                    <Award size={48} />
                    <p>No achievements yet. Keep reporting to unlock badges!</p>
                  </div>
                )}
                
                {/* Locked Achievements */}
                {stats.points < 10 && (
                  <div className="achievement-card locked">
                    <div className="achievement-icon">🌱</div>
                    <h3>Beginner</h3>
                    <p>Earn 10+ points</p>
                    <span className="achievement-status">Locked</span>
                  </div>
                )}
                {stats.points < 50 && (
                  <div className="achievement-card locked">
                    <div className="achievement-icon">⭐</div>
                    <h3>Contributor</h3>
                    <p>Earn 50+ points</p>
                    <span className="achievement-status">Locked</span>
                  </div>
                )}
                {stats.points < 100 && (
                  <div className="achievement-card locked">
                    <div className="achievement-icon">🏆</div>
                    <h3>Expert</h3>
                    <p>Earn 100+ points</p>
                    <span className="achievement-status">Locked</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="profile-card-full">
              <div className="card-header">
                <h2>Security Settings</h2>
              </div>
              <div className="security-section">
                <div className="security-item">
                  <div className="security-info">
                    <Lock size={24} />
                    <div>
                      <h3>Change Password</h3>
                      <p>Update your password to keep your account secure</p>
                    </div>
                  </div>
                  <button 
                    className="action-btn"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <Shield size={24} />
                    <div>
                      <h3>Two-Factor Authentication</h3>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <button className="action-btn secondary">
                    Enable 2FA
                  </button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <Activity size={24} />
                    <div>
                      <h3>Login Activity</h3>
                      <p>View your recent login history</p>
                    </div>
                  </div>
                  <button className="action-btn secondary">
                    View Activity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="profile-card-full">
              <div className="card-header">
                <h2>Preferences</h2>
              </div>
              <div className="preferences-section">
                <div className="preference-item">
                  <div className="preference-info">
                    <Bell size={24} />
                    <div>
                      <h3>Email Notifications</h3>
                      <p>Receive updates about your reports via email</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <Bell size={24} />
                    <div>
                      <h3>Push Notifications</h3>
                      <p>Get real-time updates on your device</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="preference-item">
                  <div className="preference-info">
                    <Activity size={24} />
                    <div>
                      <h3>Activity Alerts</h3>
                      <p>Notify when your reports are updated</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength="6"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  <Save size={16} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
