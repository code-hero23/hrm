import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, UserCircle, Filter, Share2, Copy, Check } from 'lucide-react';
import API_BASE_URL from '../config';

const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const Dashboard = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareName, setShareName] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []); // Fetch all employees once

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Stats calculation
  // Stats calculation
  const stats = {
    total: employees.length,
    new: employees.filter(e => e.status === 'New').length,
    trainee: employees.filter(e => e.status === 'Trainee').length,
    onboard: employees.filter(e => e.status === 'Onboard').length,
    current: employees.filter(e => e.status === 'Current Employee').length,
    bix: employees.filter(e => e.status === 'Bix Employee').length,
    bench: employees.filter(e => e.status === 'Bench').length,
    resigned: employees.filter(e => e.status === 'Resigned').length
  };

  const statusMap = {
    'New': '#22d3ee',
    'Trainee': '#3b82f6',
    'Onboard': '#eab308',
    'Current Employee': '#22c55e',
    'Bix Employee': '#8b5cf6',
    'Bench': '#f97316',
    'Resigned': '#ef4444'
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesStatus = status ? emp.status === status : true;
    const matchesSearch = 
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const generateOneTimeLink = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/invitations`, { shared_name: shareName });
      const { token } = res.data;
      
      const link = `${window.location.origin}/fill-form?token=${token}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Failed to generate link:', err);
      alert('Error generating invitation link. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <h2 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Workforce Overview</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.125rem', fontWeight: 500 }}>Monitor and manage the Orbix Designs ecosystem.</p>
        </div>
        {user?.role !== 'viewer' && (
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div className="card" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px', background: 'rgba(255,255,255,0.03)' }}>
              <UserCircle size={20} color="var(--accent)" />
              <input 
                type="text" 
                placeholder="Share invitation name..." 
                value={shareName}
                onChange={(e) => setShareName(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.9375rem', width: '100%', outline: 'none' }} 
              />
            </div>
            <button onClick={generateOneTimeLink} className="btn btn-secondary" title="Generates a secure ONE-TIME use link" disabled={loading} style={{ height: '48px' }}>
              {copied ? <Check size={20} color="#4ade80" /> : <Share2 size={20} className="text-accent" />}
              {copied ? 'Link Copied!' : 'One-Time Link'}
            </button>
            <Link to="/onboard" className="btn btn-primary" style={{ height: '48px' }}>
              <UserCircle size={20} /> Add Employee
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {[
          { label: 'Total Workforce', value: stats.total, color: 'var(--text)', border: 'rgba(255,255,255,0.1)' },
          { label: 'New Joining', value: stats.new, color: '#22d3ee', border: '#22d3ee' },
          { label: 'Trainees', value: stats.trainee, color: '#60a5fa', border: '#3b82f6' },
          { label: 'Onboarding', value: stats.onboard, color: '#fbbf24', border: '#eab308' },
          { label: 'Current Staff', value: stats.current, color: '#4ade80', border: '#22c55e' },
          { label: 'Bix Employees', value: stats.bix, color: '#a78bfa', border: '#8b5cf6' },
          { label: 'Bench / NP', value: stats.bench, color: '#fb923c', border: '#f97316' },
          { label: 'Resigned', value: stats.resigned, color: '#f87171', border: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} className="card stat-card" style={{ padding: '1.75rem', borderLeft: `4px solid ${stat.border}`, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{stat.label}</p>
            <h4 style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</h4>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', marginBottom: '3rem' }}>
        <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Search size={20} color="var(--text-dim)" />
          <input 
            type="text" 
            placeholder="Search by name, ID, designation..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              fontSize: '1rem', 
              width: '100%', 
              outline: 'none' 
            }} 
          />
        </div>

        <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dim)', fontSize: '0.875rem', fontWeight: 600 }}>
            <Filter size={16} /> FILTER:
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['New', 'Trainee', 'Onboard', 'Current Employee', 'Bix Employee', 'Bench', 'Resigned', ''].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`btn ${status === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.65rem', minWidth: '60px', borderRadius: '8px' }}
              >
                {s || 'ALL'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
           <div className="loader">Loading workforce...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
          {filteredEmployees.map((emp) => (
            <Link to={`/employee/${emp.id}`} key={emp.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card employee-card" style={{ position: 'relative', overflow: 'hidden', padding: '1.5rem' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: statusMap[emp.status] || '#ccc' }}></div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                    {emp.photo_path ? (
                      <img src={`${API_BASE_URL}${emp.photo_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCircle size={40} color="#475569" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.full_name}</h3>
                      <span className={`badge badge-${emp.status.toLowerCase().replace(/ /g, '-')}`} style={{ scale: '0.7', transformOrigin: 'right' }}>{emp.status}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', fontWeight: 600, marginTop: '0.25rem' }}>{emp.designation}</p>
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Dept</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.department || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>ID</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>{emp.employee_id || 'PENDING'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>D.O.J</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>{formatDate(emp.date_of_joining) || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.625rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase' }}>Official</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>{formatDate(emp.official_joining_date) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Progress Bar */}
                {(() => {
                  const steps = emp.lifecycle_steps ? (typeof emp.lifecycle_steps === 'string' ? JSON.parse(emp.lifecycle_steps) : emp.lifecycle_steps) : [];
                  const total = steps.length || 20;
                  const done = steps.filter(s => s.done).length;
                  const progress = Math.round((done / total) * 100);
                  const isDone = progress === 100;
                  
                  return (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                         <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Completion</span>
                         <span style={{ fontSize: '0.75rem', fontWeight: 900, color: isDone ? '#4ade80' : 'white' }}>{progress}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${progress}%`, 
                          height: '100%', 
                          background: isDone ? '#22c55e' : (progress < 40 ? '#ef4444' : '#3b82f6'),
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Link>
          ))}
          {filteredEmployees.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '2px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>No employee records found matching your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
