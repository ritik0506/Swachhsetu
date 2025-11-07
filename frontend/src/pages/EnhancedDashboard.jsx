import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Users,
  Target,
  Award,
  MapPin
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { dashboardAPI } from '../utils/api';
import Leaderboard from '../components/Leaderboard';
import LoadingSpinner from '../components/LoadingSpinner';
import './EnhancedDashboard.css';

const EnhancedDashboard = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, leaderboardRes, activityRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getLeaderboard({ limit: 10 }),
        dashboardAPI.getActivity({ limit: 10 })
      ]);

      setStats(statsRes.data.stats);
      setLeaderboard(leaderboardRes.data.leaderboard);
      setActivity(activityRes.data.activity);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const statCards = [
    {
      title: 'Total Reports',
      value: stats?.totalReports || 0,
      icon: <TrendingUp />,
      color: 'blue',
      trend: '+12%'
    },
    {
      title: 'Resolved Issues',
      value: stats?.resolvedReports || 0,
      icon: <CheckCircle />,
      color: 'green',
      trend: '+8%'
    },
    {
      title: 'Pending Issues',
      value: stats?.pendingReports || 0,
      icon: <Clock />,
      color: 'yellow',
      trend: '-5%'
    },
    {
      title: 'Avg Resolution Time',
      value: `${stats?.avgResolutionTime || 0}h`,
      icon: <Target />,
      color: 'purple',
      trend: '-15%'
    }
  ];

  const categoryData = stats?.categoryStats.map(cat => ({
    name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
    value: cat.count
  })) || [];

  return (
    <div className="enhanced-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Monitor city cleanliness in real-time</p>
        </div>
        <div className="time-range-selector">
          <button 
            className={timeRange === '7' ? 'active' : ''}
            onClick={() => setTimeRange('7')}
          >
            7D
          </button>
          <button 
            className={timeRange === '30' ? 'active' : ''}
            onClick={() => setTimeRange('30')}
          >
            30D
          </button>
          <button 
            className={timeRange === '90' ? 'active' : ''}
            onClick={() => setTimeRange('90')}
          >
            90D
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            className={`stat-card stat-card-${card.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-card-header">
              <div className="stat-icon">{card.icon}</div>
              <span className="stat-trend">{card.trend}</span>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-title">{card.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Reports Over Time */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3>Reports Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.reportsOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="_id" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border)' 
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="var(--primary)" 
                strokeWidth={3}
                dot={{ fill: 'var(--primary)', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Leaderboard and Activity */}
      <div className="bottom-grid">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Leaderboard leaders={leaderboard} type="points" />
        </motion.div>

        <motion.div 
          className="activity-feed"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {activity.map((item, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <MapPin size={16} />
                </div>
                <div className="activity-details">
                  <div className="activity-title">{item.title}</div>
                  <div className="activity-meta">
                    <span className={`badge badge-${
                      item.status === 'resolved' ? 'success' : 
                      item.status === 'in-progress' ? 'warning' : 'info'
                    }`}>
                      {item.status}
                    </span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Resolution Rate */}
      <motion.div 
        className="resolution-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="resolution-header">
          <Award size={24} color="var(--primary)" />
          <h3>Overall Resolution Rate</h3>
        </div>
        <div className="resolution-progress">
          <div 
            className="resolution-bar" 
            style={{ width: `${stats?.resolutionRate || 0}%` }}
          >
            <span>{stats?.resolutionRate}%</span>
          </div>
        </div>
        <p className="resolution-text">
          {stats?.resolvedReports} of {stats?.totalReports} issues resolved
        </p>
      </motion.div>
    </div>
  );
};

export default EnhancedDashboard;
