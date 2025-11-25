import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  Bell, 
  Bot, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Languages, 
  MapPin, 
  UserCheck,
  Send,
  Loader,
  X,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import '../styles/Updates.css';

const Updates = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, ai, notifications, messages
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch updates on mount
  useEffect(() => {
    if (user) {
      fetchUpdates();
      fetchAILogs();
      fetchNotifications();
    }
  }, [user]);

  // Listen to real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !connected) return;

    // AI Processing Updates
    socket.on('ai:triage:start', (data) => {
      addUpdate({
        type: 'ai_processing',
        icon: 'bot',
        title: 'AI Triage Started',
        message: `Analyzing your report: "${data.reportTitle}"`,
        details: 'Language detection and classification in progress...',
        timestamp: new Date(),
        reportId: data.reportId,
        status: 'processing'
      });
    });

    socket.on('ai:triage:complete', (data) => {
      addUpdate({
        type: 'ai_complete',
        icon: 'check',
        title: 'AI Analysis Complete',
        message: `Report classified as ${data.category} - ${data.severity} severity`,
        details: `Priority: ${data.priority} | Confidence: ${(data.confidence * 100).toFixed(0)}%`,
        timestamp: new Date(),
        reportId: data.reportId,
        status: 'success',
        aiAnalysis: data
      });
    });

    socket.on('ai:translation:complete', (data) => {
      addUpdate({
        type: 'ai_translation',
        icon: 'languages',
        title: 'Translation Complete',
        message: `Translated from ${data.sourceLang} to ${data.targetLang}`,
        details: `Original: "${data.original.substring(0, 50)}..."`,
        timestamp: new Date(),
        reportId: data.reportId,
        status: 'success'
      });
    });

    socket.on('ai:geospatial:analyzed', (data) => {
      addUpdate({
        type: 'ai_geospatial',
        icon: 'map',
        title: 'Location Analysis',
        message: `Found ${data.nearbyReports} similar reports nearby`,
        details: data.isHotspot ? '⚠️ This is a hotspot area!' : 'Normal activity area',
        timestamp: new Date(),
        reportId: data.reportId,
        status: 'info'
      });
    });

    socket.on('ai:assignment:suggested', (data) => {
      addUpdate({
        type: 'ai_assignment',
        icon: 'user_check',
        title: 'Inspector Assigned',
        message: `${data.inspectorName} has been assigned to your report`,
        details: `Confidence: ${(data.confidence * 100).toFixed(0)}% | Distance: ${data.distance}km`,
        timestamp: new Date(),
        reportId: data.reportId,
        status: 'success'
      });
    });

    socket.on('ai:followup:scheduled', (data) => {
      addUpdate({
        type: 'ai_followup',
        icon: 'clock',
        title: 'Follow-up Scheduled',
        message: 'We will check with you in 48 hours',
        details: `Scheduled for: ${new Date(data.scheduledAt).toLocaleString()}`,
        timestamp: new Date(),
        reportId: data.reportId,
        status: 'info'
      });
    });

    socket.on('ai:followup:sent', (data) => {
      addUpdate({
        type: 'ai_message',
        icon: 'send',
        title: 'Follow-up Message Sent',
        message: data.message,
        details: `Sent via: ${data.channels.join(', ')}`,
        timestamp: new Date(),
        reportId: data.reportId,
        status: 'success'
      });
    });

    // Regular notifications
    socket.on('notification', (notification) => {
      addUpdate({
        type: 'notification',
        icon: 'bell',
        title: notification.title,
        message: notification.message,
        details: notification.data?.details || '',
        timestamp: new Date(),
        status: 'info',
        priority: notification.priority
      });
    });

    // Report status updates
    socket.on('reportUpdated', (report) => {
      if (user && report.userId === user.id) {
        addUpdate({
          type: 'status_update',
          icon: 'alert',
          title: 'Report Status Updated',
          message: `Your report is now: ${report.status}`,
          details: report.statusNotes || '',
          timestamp: new Date(),
          reportId: report._id,
          status: getStatusColor(report.status)
        });
      }
    });

    return () => {
      socket.off('ai:triage:start');
      socket.off('ai:triage:complete');
      socket.off('ai:translation:complete');
      socket.off('ai:geospatial:analyzed');
      socket.off('ai:assignment:suggested');
      socket.off('ai:followup:scheduled');
      socket.off('ai:followup:sent');
      socket.off('notification');
      socket.off('reportUpdated');
    };
  }, [socket, connected, user]);

  const fetchUpdates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const formattedUpdates = response.data.map(notif => ({
        id: notif._id,
        type: 'notification',
        icon: 'bell',
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.createdAt),
        status: 'info',
        read: notif.read
      }));

      setUpdates(prev => [...formattedUpdates, ...prev]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchAILogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/ai/logs?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const aiUpdates = response.data.logs.map(log => ({
        id: log._id,
        type: 'ai_log',
        icon: getAIIcon(log.operation),
        title: getAITitle(log.operation),
        message: getAIMessage(log),
        details: getAIDetails(log),
        timestamp: new Date(log.createdAt),
        status: log.status === 'completed' ? 'success' : 'error',
        reportId: log.reportId,
        aiData: log
      }));

      setUpdates(prev => [...prev, ...aiUpdates]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AI logs:', error);
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications/unread/count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const addUpdate = (update) => {
    setUpdates(prev => [{ id: Date.now(), ...update }, ...prev]);
    if (!update.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = async (updateId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/notifications/${updateId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUpdates(prev => 
        prev.map(update => 
          update.id === updateId ? { ...update, read: true } : update
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUpdates(prev => prev.map(update => ({ ...update, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearUpdate = (updateId) => {
    setUpdates(prev => prev.filter(update => update.id !== updateId));
  };

  const getFilteredUpdates = () => {
    if (filter === 'all') return updates;
    if (filter === 'ai') return updates.filter(u => u.type.startsWith('ai_'));
    if (filter === 'notifications') return updates.filter(u => u.type === 'notification');
    if (filter === 'messages') return updates.filter(u => u.type === 'ai_message' || u.type === 'status_update');
    return updates;
  };

  const getIcon = (iconType) => {
    const icons = {
      bot: <Bot size={20} />,
      check: <CheckCircle size={20} />,
      clock: <Clock size={20} />,
      alert: <AlertCircle size={20} />,
      bell: <Bell size={20} />,
      languages: <Languages size={20} />,
      map: <MapPin size={20} />,
      user_check: <UserCheck size={20} />,
      send: <Send size={20} />,
      message: <MessageSquare size={20} />
    };
    return icons[iconType] || <Bell size={20} />;
  };

  const getStatusColor = (status) => {
    const colors = {
      processing: 'warning',
      success: 'success',
      error: 'danger',
      info: 'info',
      pending: 'warning',
      'in-progress': 'info',
      resolved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'info';
  };

  const getAIIcon = (operation) => {
    const icons = {
      triage: 'bot',
      translation: 'languages',
      assignment: 'user_check',
      followup: 'message',
      geospatial: 'map'
    };
    return icons[operation] || 'bot';
  };

  const getAITitle = (operation) => {
    const titles = {
      triage: 'AI Report Analysis',
      translation: 'Language Translation',
      assignment: 'Inspector Assignment',
      followup: 'Follow-up Message',
      geospatial: 'Location Analysis'
    };
    return titles[operation] || 'AI Processing';
  };

  const getAIMessage = (log) => {
    if (log.operation === 'triage' && log.result) {
      return `Classified as ${log.result.category} - ${log.result.severity} severity`;
    }
    if (log.operation === 'translation' && log.result) {
      return `Translated from ${log.result.source_lang} to ${log.result.target_lang}`;
    }
    if (log.operation === 'assignment' && log.result) {
      return `Assigned to ${log.result.inspectorName || 'inspector'}`;
    }
    return `${log.operation} completed`;
  };

  const getAIDetails = (log) => {
    if (log.operation === 'triage' && log.result) {
      return `Confidence: ${(log.result.confidence * 100).toFixed(0)}% | Priority: ${log.result.priority}`;
    }
    if (log.result && log.result.geoContext) {
      return `Nearby reports: ${log.result.geoContext.nearbyReports || 0}`;
    }
    return `Processed in ${log.processingTime}ms`;
  };

  const exportUpdates = () => {
    const dataStr = JSON.stringify(updates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `updates-${new Date().toISOString()}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="updates-container">
        <div className="updates-loading">
          <Loader className="spinner" size={40} />
          <p>Loading updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="updates-container">
      <div className="updates-header">
        <div className="updates-title">
          <Bell size={24} />
          <h2>Updates & Notifications</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        
        <div className="updates-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-mark-read">
              <CheckCircle size={16} />
              Mark all read
            </button>
          )}
          <button onClick={exportUpdates} className="btn-export">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="updates-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <Filter size={16} />
          All ({updates.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'ai' ? 'active' : ''}`}
          onClick={() => setFilter('ai')}
        >
          <Bot size={16} />
          AI Activity ({updates.filter(u => u.type.startsWith('ai_')).length})
        </button>
        <button 
          className={`filter-btn ${filter === 'notifications' ? 'active' : ''}`}
          onClick={() => setFilter('notifications')}
        >
          <Bell size={16} />
          Notifications ({updates.filter(u => u.type === 'notification').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'messages' ? 'active' : ''}`}
          onClick={() => setFilter('messages')}
        >
          <MessageSquare size={16} />
          Messages ({updates.filter(u => u.type === 'ai_message' || u.type === 'status_update').length})
        </button>
      </div>

      <div className="updates-connection-status">
        <div className={`connection-indicator ${connected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{connected ? 'Live updates active' : 'Reconnecting...'}</span>
        </div>
      </div>

      <div className="updates-list">
        {getFilteredUpdates().length === 0 ? (
          <div className="updates-empty">
            <Bell size={48} />
            <h3>No updates yet</h3>
            <p>You'll see AI processing steps, notifications, and messages here</p>
          </div>
        ) : (
          getFilteredUpdates().map((update) => (
            <div 
              key={update.id} 
              className={`update-card ${update.status} ${!update.read ? 'unread' : ''}`}
            >
              <div className="update-icon">
                {getIcon(update.icon)}
              </div>
              
              <div className="update-content">
                <div className="update-header-row">
                  <h4>{update.title}</h4>
                  <span className="update-time">
                    {formatTimestamp(update.timestamp)}
                  </span>
                </div>
                
                <p className="update-message">{update.message}</p>
                
                {update.details && (
                  <p className="update-details">{update.details}</p>
                )}
                
                {update.aiAnalysis && (
                  <div className="ai-analysis-preview">
                    <div className="analysis-tags">
                      {update.aiAnalysis.keywords?.slice(0, 3).map((keyword, idx) => (
                        <span key={idx} className="keyword-tag">{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {update.reportId && (
                  <a 
                    href={`/reports/${update.reportId}`} 
                    className="view-report-link"
                  >
                    <Eye size={14} />
                    View Report
                  </a>
                )}
              </div>
              
              <div className="update-actions">
                {!update.read && (
                  <button 
                    onClick={() => markAsRead(update.id)}
                    className="btn-icon"
                    title="Mark as read"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                <button 
                  onClick={() => clearUpdate(update.id)}
                  className="btn-icon btn-close"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper function
function formatTimestamp(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default Updates;
