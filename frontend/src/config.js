const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:5018' 
  : ''; // Use relative paths in production to leverage Nginx proxy

export const getAuthToken = () => {
  try {
    const raw = localStorage.getItem('adminUser');
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.token) return user.token;
    }
  } catch (e) {}
  return '';
};

export const getMediaUrl = (path, extraToken = '') => {
  if (!path) return '';
  const base = `${API_BASE_URL || ''}${path}`;
  const token = extraToken || getAuthToken();
  if (!token) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};

export default API_BASE_URL;
