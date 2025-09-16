// API Configuration
const getApiUrl = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  }
  
  // Production URL - Your Koyeb backend
  return process.env.NEXT_PUBLIC_API_URL || 'https://mobile-enrica-billder-b7b36c60.koyeb.app/api';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  ENDPOINTS: {
    LOGIN: '/users/login/',
    LOGOUT: '/users/logout/',
    PROFILE: '/users/profile/',
    REGISTER: '/users/register/',
  }
};

// Helper function to get full URL
export const getApiEndpoint = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
