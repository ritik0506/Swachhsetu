import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Report APIs
export const reportAPI = {
  createReport: (formData) => {
    return api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getReports: (params) => api.get('/reports', { params }),
  getReport: (id) => api.get(`/reports/${id}`),
  getMyReports: () => api.get('/reports/my-reports'),
  upvoteReport: (id) => api.post(`/reports/${id}/upvote`),
  addComment: (id, text) => api.post(`/reports/${id}/comment`, { text }),
  updateStatus: (id, status) => api.put(`/reports/${id}/status`, { status })
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getLeaderboard: (params) => api.get('/dashboard/leaderboard', { params }),
  getActivity: (params) => api.get('/dashboard/activity', { params }),
  getHeatmap: () => api.get('/dashboard/heatmap')
};

// Admin APIs
export const adminAPI = {
  // Reports
  getAllReports: (params) => api.get('/admin/reports', { params }),
  updateReport: (id, data) => api.put(`/admin/reports/${id}`, data),
  deleteReport: (id) => api.delete(`/admin/reports/${id}`),
  bulkUpdateReports: (data) => api.put('/admin/reports/bulk-update', data),
  
  // Waste Dump Map
  getWasteDumpMapData: (params) => api.get('/admin/waste-dump-map', { params }),
  
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  
  // Statistics
  getStatistics: () => api.get('/admin/statistics')
};

export default api;