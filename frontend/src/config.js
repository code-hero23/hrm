const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5018' 
  : ''; // Use relative paths in production to leverage Nginx proxy

export default API_BASE_URL;
