import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { 
  CheckCircle, 
  Clock, 
  MapPin,
  Award,
  Plus,
  Calendar,
  Target,
  Trophy,
  Zap,
  Activity
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    averageResponseTime: 0,
    userPoints: 0,
    userLevel: 1,
    userRank: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todaysSchedule, setTodaysSchedule] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardRes, scheduleRes] = await Promise.all([
        api.get('/dashboard/user'),
        api.get('/garbage/today').catch(() => ({ data: { schedules: [] } }))
      ]);

      const { stats: dashboardStats, recentReports: reports } = dashboardRes.data.data;
      
      setStats({
        totalReports: dashboardStats.totalReports,
        resolvedReports: dashboardStats.resolvedReports,
        pendingReports: dashboardStats.pendingReports,
        inProgressReports: dashboardStats.inProgressReports,
        averageResponseTime: dashboardStats.averageResponseTime,
        userPoints: dashboardStats.userPoints,
        userLevel: dashboardStats.userLevel,
        userRank: dashboardStats.userRank
      });

      setRecentReports(reports);
      setTodaysSchedule(scheduleRes.data.schedules || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Report Issue",
      icon: <Plus size={20} />,
      color: "#3b82f6",
      action: () => navigate('/report-issue')
    },
    {
      title: "Garbage Schedule",
      icon: <Calendar size={20} />,
      color: "#10b981",
      action: () => navigate('/garbage-schedule')
    },
    {
      title: "My Reports",
      icon: <MapPin size={20} />,
      color: "#f59e0b",
      action: () => navigate('/profile')
    }
  ];

  const achievements = [
    { 
      name: "First Report", 
      unlocked: stats.totalReports >= 1,
      icon: "🎯",
      description: "Submit your first report"
    },
    { 
      name: "Problem Solver", 
      unlocked: stats.resolvedReports >= 5,
      icon: "⭐",
      description: "Get 5 reports resolved"
    },
    { 
      name: "Active Citizen", 
      unlocked: stats.totalReports >= 10,
      icon: "🏆",
      description: "Submit 10 reports"
    },
    { 
      name: "Community Champion", 
      unlocked: stats.userPoints >= 100,
      icon: "👑",
      description: "Earn 100 points"
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-content">
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p className="hero-subtitle">Your personal civic action hub</p>
          </div>
          <div className="user-level-card">
            <div className="level-icon">
              <Trophy size={32} color="#fbbf24" />
            </div>
            <div className="level-info">
              <span className="level-label">Level {stats.userLevel}</span>
              <div className="points-display">
                <Zap size={16} color="#fbbf24" />
                <span>{stats.userPoints} Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="quick-action-btn"
                onClick={action.action}
                style={{ '--action-color': action.color }}
              >
                <div className="action-icon" style={{ backgroundColor: `${action.color}15` }}>
                  {action.icon}
                </div>
                <span>{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-box">
            <div className="stat-header">
              <MapPin size={20} color="#3b82f6" />
              <span>Total Reports</span>
            </div>
            <div className="stat-value">{stats.totalReports}</div>
          </div>
          <div className="stat-box">
            <div className="stat-header">
              <CheckCircle size={20} color="#10b981" />
              <span>Resolved</span>
            </div>
            <div className="stat-value">{stats.resolvedReports}</div>
          </div>
          <div className="stat-box">
            <div className="stat-header">
              <Clock size={20} color="#f59e0b" />
              <span>Pending</span>
            </div>
            <div className="stat-value">{stats.pendingReports}</div>
          </div>
          <div className="stat-box">
            <div className="stat-header">
              <Target size={20} color="#8b5cf6" />
              <span>Avg Response</span>
            </div>
            <div className="stat-value">{stats.averageResponseTime}h</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-content-grid">
          {/* Recent Activity */}
          <div className="content-card recent-activity-card">
            <h3 className="card-title">
              <Activity size={20} />
              Recent Activity
            </h3>
            {recentReports.length > 0 ? (
              <div className="activity-list">
                {recentReports.slice(0, 5).map((report) => (
                  <div key={report._id} className="activity-item">
                    <div className={`activity-indicator ${report.status}`}></div>
                    <div className="activity-content">
                      <h4>{report.issueType}</h4>
                      <p>{report.description?.substring(0, 60)}...</p>
                      <div className="activity-meta">
                        <span className={`status-pill ${report.status}`}>
                          {report.status}
                        </span>
                        <span className="time-ago">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <MapPin size={48} color="#cbd5e1" />
                <p>No activity yet</p>
                <button className="btn-primary" onClick={() => navigate('/report-issue')}>
                  Submit Your First Report
                </button>
              </div>
            )}
          </div>

          {/* Achievements & Today's Schedule */}
          <div className="sidebar-cards">
            {/* Achievements */}
            <div className="content-card achievements-card">
              <h3 className="card-title">
                <Award size={20} />
                Achievements
              </h3>
              <div className="achievements-grid">
                {achievements.map((achievement, idx) => (
                  <div 
                    key={idx} 
                    className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                    title={achievement.description}
                  >
                    <span className="achievement-icon">{achievement.icon}</span>
                    <span className="achievement-name">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Garbage Schedule */}
            <div className="content-card schedule-card">
              <h3 className="card-title">
                <Calendar size={20} />
                Today's Collection
              </h3>
              {todaysSchedule.length > 0 ? (
                <div className="schedule-list">
                  {todaysSchedule.slice(0, 3).map((schedule) => (
                    <div key={schedule._id} className="schedule-item">
                      <div className="schedule-location">
                        <MapPin size={16} />
                        <span>{schedule.area}</span>
                      </div>
                      <div className="schedule-time">
                        {schedule.todaySlots?.[0]?.startTime || 'TBD'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="schedule-empty">No collections scheduled today</p>
              )}
              <button 
                className="view-more-btn"
                onClick={() => navigate('/garbage-schedule')}
              >
                View Full Schedule →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
