import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, UserCircle, Filter, Share2, Copy, Check } from 'lucide-react';
import API_BASE_URL from '../config';

const Dashboard = () => {
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
    trainee: employees.filter(e => e.status === 'Trainee').length,
    onboard: employees.filter(e => e.status === 'Onboard').length,
    current: employees.filter(e => e.status === 'Current Employee').length,
    bix: employees.filter(e => e.status === 'Bix Employee').length,
    bench: employees.filter(e => e.status === 'Bench').length,
    resigned: employees.filter(e => e.status === 'Resigned').length
  };

  const statusMap = {
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

  const copyFormLink = () => {
    let link = `${window.location.origin}/fill-form`;
    if (shareName) {
      link += `?name=${encodeURIComponent(shareName)}`;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      // Fallback for non-secure contexts (HTTP)
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>Core Database</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>Manage and monitor Orbix Designs workforce.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="card" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '250px' }}>
            <UserCircle size={18} color="var(--text-dim)" />
            <input 
              type="text" 
              placeholder="Employee Name (for link)..." 
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.875rem', width: '100%', outline: 'none' }} 
            />
          </div>
          <button onClick={copyFormLink} className="btn btn-secondary" title="Shares a link pre-filled with the name above">
            {copied ? <Check size={18} color="#22c55e" /> : <Share2 size={18} />}
            {copied ? 'Link Copied!' : 'Generate Link'}
          </button>
          <Link to="/onboard" className="btn btn-primary">
            <UserCircle size={18} /> Add Employee
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Workforce</p>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem' }}>{stats.total}</h4>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trainee</p>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem', color: '#60a5fa' }}>{stats.trainee}</h4>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #eab308' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onboarding</p>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem', color: '#fbbf24' }}>{stats.onboard}</h4>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #22c55e' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current</p>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem', color: '#4ade80' }}>{stats.current}</h4>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bix Emp</p>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem', color: '#a78bfa' }}>{stats.bix}</h4>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f97316' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bench/NP</p>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem', color: '#fb923c' }}>{stats.bench}</h4>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resigned</p>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem', color: '#f87171' }}>{stats.resigned}</h4>
        </div>
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
            {['', 'Trainee', 'Onboard', 'Current Employee', 'Bix Employee', 'Bench', 'Resigned'].map((s) => (
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
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Dept</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>{emp.department || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>ID</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>{emp.employee_id || 'PENDING'}</p>
                      </div>
                    </div>
                  </div>
                </div>
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
