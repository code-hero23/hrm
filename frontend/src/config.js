const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:5018' 
  : ''; // Use relative paths in production to leverage Nginx proxy

export default API_BASE_URL;
