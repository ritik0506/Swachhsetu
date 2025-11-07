import React, { useState, useEffect } from "react";
import DashboardCard from "../components/DashboardCard";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MapPin,
  Users,
  Award
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    averageResponseTime: 0,
    userPoints: 0,
    userRank: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch reports statistics
      const reportsResponse = await api.get('/reports');
      const reports = reportsResponse.data;
      
      const totalReports = reports.length;
      const resolvedReports = reports.filter(r => r.status === 'resolved').length;
      const pendingReports = reports.filter(r => r.status === 'pending').length;
      const inProgressReports = reports.filter(r => r.status === 'in-progress').length;
      
      // Calculate average response time
      const resolvedWithTime = reports.filter(r => 
        r.status === 'resolved' && r.resolvedAt && r.createdAt
      );
      const avgTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, r) => {
            const diff = new Date(r.resolvedAt) - new Date(r.createdAt);
            return acc + diff / (1000 * 60 * 60); // Convert to hours
          }, 0) / resolvedWithTime.length
        : 0;

      setStats({
        totalReports,
        resolvedReports,
        pendingReports,
        inProgressReports,
        averageResponseTime: avgTime.toFixed(1),
        userPoints: user?.points || 0,
        userRank: user?.rank || 0
      });

      // Get recent reports (latest 5)
      setRecentReports(reports.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Reports",
      count: stats.totalReports,
      icon: <AlertCircle size={24} />,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)"
    },
    {
      title: "Resolved Issues",
      count: stats.resolvedReports,
      icon: <CheckCircle size={24} />,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)"
    },
    {
      title: "Pending Issues",
      count: stats.pendingReports,
      icon: <Clock size={24} />,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)"
    },
    {
      title: "In Progress",
      count: stats.inProgressReports,
      icon: <TrendingUp size={24} />,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)"
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h2>Welcome back, {user?.name}! 👋</h2>
            <p>Real-time overview of civic hygiene management</p>
          </div>
          <div className="user-stats">
            <div className="stat-badge">
              <Award size={20} />
              <span>{stats.userPoints} Points</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {statsCards.map((item, idx) => (
            <div 
              key={idx} 
              className="stat-card-enhanced"
              style={{ 
                '--card-color': item.color,
                '--card-bg': item.bgColor 
              }}
            >
              <div className="stat-icon" style={{ backgroundColor: item.bgColor, color: item.color }}>
                {item.icon}
              </div>
              <div className="stat-content">
                <h3>{item.count}</h3>
                <p>{item.title}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-sections">
          <div className="recent-reports-section">
            <h3>
              <MapPin size={20} />
              Recent Reports
            </h3>
            {recentReports.length > 0 ? (
              <div className="reports-list">
                {recentReports.map((report) => (
                  <div key={report._id} className="report-item">
                    <div className="report-info">
                      <h4>{report.issueType}</h4>
                      <p>{report.description?.substring(0, 80)}...</p>
                      <span className="report-time">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`status-badge ${report.status}`}>
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No reports available</p>
            )}
          </div>

          <div className="quick-stats">
            <h3>Quick Stats</h3>
            <div className="quick-stat-item">
              <span>Average Response Time</span>
              <strong>{stats.averageResponseTime} hrs</strong>
            </div>
            <div className="quick-stat-item">
              <span>Resolution Rate</span>
              <strong>
                {stats.totalReports > 0 
                  ? ((stats.resolvedReports / stats.totalReports) * 100).toFixed(1)
                  : 0}%
              </strong>
            </div>
            <div className="quick-stat-item">
              <span>Active Issues</span>
              <strong>{stats.pendingReports + stats.inProgressReports}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
