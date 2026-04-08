import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users, ExternalLink, Briefcase, FileText, FileUp, Database } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import EmployeeDetails from './pages/EmployeeDetails';
import BulkImport from './pages/BulkImport';
import EditEmployee from './pages/EditEmployee';
import Bucket from './pages/Bucket';
import WishesBucket from './pages/WishesBucket';
import Login from './pages/Login';

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
          <NavLink to="/onboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <UserPlus size={20} /> <span>New Employee</span>
          </NavLink>
          <NavLink to="/bulk-import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <FileUp size={20} /> <span>Bulk Import</span>
          </NavLink>
          <NavLink to="/bucket" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Database size={20} /> <span>Resource Bucket</span>
          </NavLink>
          <NavLink to="/wishes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Gift size={20} /> <span>Wishes Bucket</span>
          </NavLink>
        </div>
        
        <div className="external-links nav-links" style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <div className="nav-link" style={{ cursor: 'default', color: '#64748b', fontSize: '0.75rem' }}>ADMIN: {user.username}</div>
          <button onClick={onLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
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
  const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('adminUser')));

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <NavLink to="/" /> : <Login onLogin={setUser} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard /></Layout> : <Login onLogin={setUser} />} />
        <Route path="/onboard" element={user ? <Layout user={user} onLogout={handleLogout}><Onboarding /></Layout> : <Login onLogin={setUser} />} />
        <Route path="/bulk-import" element={user ? <Layout user={user} onLogout={handleLogout}><BulkImport /></Layout> : <Login onLogin={setUser} />} />
        <Route path="/employee/:id" element={user ? <Layout user={user} onLogout={handleLogout}><EmployeeDetails /></Layout> : <Login onLogin={setUser} />} />
        <Route path="/edit-employee/:id" element={user ? <Layout user={user} onLogout={handleLogout}><EditEmployee /></Layout> : <Login onLogin={setUser} />} />
        <Route path="/bucket" element={user ? <Layout user={user} onLogout={handleLogout}><Bucket /></Layout> : <Login onLogin={setUser} />} />
        <Route path="/wishes" element={user ? <Layout user={user} onLogout={handleLogout}><WishesBucket /></Layout> : <Login onLogin={setUser} />} />
        <Route path="/fill-form" element={<Layout isPublic={true}><Onboarding isPublic={true} /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
