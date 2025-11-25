// Environment configuration for API and Socket.IO endpoints
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Export for convenience
export default {
  API_URL,
  SOCKET_URL,
};
