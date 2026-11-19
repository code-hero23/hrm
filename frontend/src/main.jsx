import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

axios.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('adminUser');
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch (e) {}
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
