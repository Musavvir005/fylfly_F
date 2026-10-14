// Central API configuration
// Automatically connects to localhost:5000 in development, and your live Render backend in production
export const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://fylfly-backend.onrender.com'
    : 'http://localhost:5000')
).replace(/\/+$/, '');
