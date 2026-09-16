import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, ExternalLink, FileUp, Database, Gift, Archive } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import EmployeeDetails from './pages/EmployeeDetails';
import BulkImport from './pages/BulkImport';
import EditEmployee from './pages/EditEmployee';
import Bucket from './pages/Bucket';
import WishesBucket from './pages/WishesBucket';
import Backups from './pages/Backups';
import Login from './pages/Login';
import axios from 'axios';
import API_BASE_URL from './config';
import './App.css';
const Layout = ({ children, isPublic, user, onLogout }) => {
  if (isPublic) return <div className="public-form-container">{children}</div>;
  if (!user) return null; // Should be handled by router
  
  return (
    <div className="app-container">
      <nav className="sidebar">
        <h1>ORBIX DESIGNS</h1>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </NavLink>
          {user.role !== 'viewer' && (
            <>
              <NavLink to="/onboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <UserPlus size={20} /> <span>New Employee</span>
              </NavLink>
              <NavLink to="/bulk-import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FileUp size={20} /> <span>Bulk Import</span>
              </NavLink>
            </>
          )}
          <NavLink to="/bucket" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Database size={20} /> <span>Resource Bucket</span>
          </NavLink>
          <NavLink to="/wishes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Gift size={20} /> <span>Wishes Bucket</span>
          </NavLink>
          {/* {user.role !== 'viewer' && (
            <NavLink to="/backups" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Archive size={20} /> <span>Backups</span>
            </NavLink>
          )} */}
        </div>
        
        <div className="external-links nav-links" style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <div className="nav-link" style={{ cursor: 'default', color: 'var(--text-dim)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', marginRight: '0.5rem' }}></div>
            {user.username.toUpperCase()}
          </div>
          <button onClick={onLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: '0.5rem' }}>
            <ExternalLink size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser'));
    } catch (e) {
      return null;
    }
  });
  const [authNotice, setAuthNotice] = React.useState('');

  const handleLogout = React.useCallback((notice = '') => {
    localStorage.removeItem('adminUser');
    setUser(null);
    if (notice) setAuthNotice(notice);
  }, []);

  React.useEffect(() => {
    const verifyCurrentSession = async () => {
      const stored = localStorage.getItem('adminUser');
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored);
        if (!parsed || !parsed.token) {
          handleLogout('Please log in with your credentials.');
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/api/verify-session`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
          timeout: 6000
        });

        if (res.data && res.data.valid) {
          setUser(prev => prev ? { ...prev, ...res.data.user } : { ...res.data.user, token: parsed.token });
        } else {
          handleLogout('Session expired. Please log in again.');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const errMsg = err.response.data?.error || 'Password was changed or session expired. Please log in again.';
          handleLogout(errMsg);
        } else {
          console.warn('Session verification notice:', err.message);
        }
      }
    };

    verifyCurrentSession();
  }, [handleLogout]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <NavLink to="/" /> : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={() => handleLogout()}><Dashboard user={user} /></Layout> : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/onboard" element={user ? (user.role === 'viewer' ? <NavLink to="/" /> : <Layout user={user} onLogout={() => handleLogout()}><Onboarding /></Layout>) : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/bulk-import" element={user ? (user.role === 'viewer' ? <NavLink to="/" /> : <Layout user={user} onLogout={() => handleLogout()}><BulkImport /></Layout>) : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/employee/:id" element={user ? <Layout user={user} onLogout={() => handleLogout()}><EmployeeDetails user={user} /></Layout> : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/edit-employee/:id" element={user ? (user.role === 'viewer' ? <NavLink to="/" /> : <Layout user={user} onLogout={() => handleLogout()}><EditEmployee /></Layout>) : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/bucket" element={user ? <Layout user={user} onLogout={() => handleLogout()}><Bucket user={user} /></Layout> : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/wishes" element={user ? <Layout user={user} onLogout={() => handleLogout()}><WishesBucket /></Layout> : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/backups" element={user ? (user.role === 'viewer' ? <NavLink to="/" /> : <Layout user={user} onLogout={() => handleLogout()}><Backups /></Layout>) : <Login onLogin={setUser} notice={authNotice} />} />
        <Route path="/fill-form" element={<Layout isPublic={true}><Onboarding isPublic={true} /></Layout>} />
        <Route path="/edit-form" element={<Layout isPublic={true}><EditEmployee isPublicEdit={true} /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
