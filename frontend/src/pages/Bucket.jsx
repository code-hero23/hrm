import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  Mail, 
  Phone, 
  Plus, 
  UserPlus, 
  XCircle, 
  Upload, 
  Trash2, 
  CheckCircle,
  Filter,
  Search,
  Activity
} from 'lucide-react';
import API_BASE_URL from '../config';

const Bucket = () => {
  const [resources, setResources] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(null); // resource ID
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Email');

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bucket`);
      setResources(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bucket:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleBulkImport = async () => {
    try {
      // Expecting format: type, value (csv-like) or just values separated by newlines
      const lines = bulkData.split('\n').filter(l => l.trim());
      const payload = lines.map(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          return { type: parts[0].trim(), value: parts[1].trim() };
        }
        // Fallback: detect type
        const val = line.trim();
        return { 
          type: val.includes('@') ? 'Email' : 'Phone', 
          value: val 
        };
      });

      await axios.post(`${API_BASE_URL}/api/bucket/bulk`, payload);
      setShowBulkModal(false);
      setBulkData('');
      fetchData();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  const handleAssign = async (employeeId) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/bucket/${showAssignModal}/assign`, { assigned_to: employeeId });
      setShowAssignModal(null);
      fetchData();
    } catch (err) {
      alert('Assignment failed');
    }
  };

  const handleUnassign = async (id) => {
    if (!window.confirm('Are you sure you want to unassign this resource?')) return;
    try {
      await axios.patch(`${API_BASE_URL}/api/bucket/${id}/unassign`);
      fetchData();
    } catch (err) {
      alert('Unassignment failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource permanently?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/bucket/${id}`);
      fetchData();
    } catch (err) {
      alert('Deletion failed');
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesTab = r.type.toLowerCase() === activeTab.toLowerCase();
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesSearch = r.value.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesStatus && matchesSearch;
  });

  if (loading) return <div className="p-8 text-center text-white">Loading Bucket...</div>;

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Database size={40} className="text-accent" /> Resource Bucket
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Manage and assign official company {activeTab.toLowerCase()} addresses.
          </p>
        </div>
        <button 
          onClick={() => setShowBulkModal(true)}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem' }}
        >
          <Upload size={20} /> Bulk Import
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        {['Email', 'Phone'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? 'white' : 'var(--text-dim)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab === 'Email' ? <Mail size={18} /> : <Phone size={18} />}
            {tab === 'Email' ? 'Official Emails' : 'Phone Numbers'}
          </button>
        ))}
      </div>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: `Total ${activeTab}s`, value: resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase()).length, icon: Database, color: '#3b82f6' },
          { label: 'Available', value: resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase() && r.status === 'Available').length, icon: CheckCircle, color: '#22c55e' },
          { label: 'Assigned', value: resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase() && r.status === 'Assigned').length, icon: Activity, color: '#f59e0b' }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: `${stat.color}20`, padding: '1rem', borderRadius: '12px' }}>
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '12px', 
              padding: '0.875rem 1rem 0.875rem 3rem',
              color: 'white'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Filter size={18} className="text-dim" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              color: 'white', 
              border: '1px solid var(--glass-border)', 
              padding: '0.875rem 1.5rem', 
              borderRadius: '12px' 
            }}
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned To</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>No {activeTab.toLowerCase()}s found matching your search.</td>
              </tr>
            ) : filteredResources.map(resource => (
              <tr key={resource.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '10px' }}>
                      {resource.type.toLowerCase() === 'email' ? <Mail size={18} className="text-accent" /> : <Phone size={18} className="text-accent" />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{resource.value}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{resource.type}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{ 
                    fontSize: '0.625rem', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    padding: '4px 10px', 
                    borderRadius: '20px',
                    background: resource.status === 'Available' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: resource.status === 'Available' ? '#22c55e' : '#f59e0b',
                    border: `1px solid ${resource.status === 'Available' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                    display: 'inline-block'
                  }}>
                    {resource.status}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  {resource.status === 'Assigned' ? (
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{resource.assigned_to_name || 'System User'}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{resource.assigned_date}</p>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {resource.status === 'Available' ? (
                      <button 
                        onClick={() => setShowAssignModal(resource.id)}
                        className="btn-primary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <UserPlus size={14} /> Assign
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUnassign(resource.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <XCircle size={14} /> Unassign
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(resource.id)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', transition: '0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Assign to Employee</h2>
              <XCircle size={24} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowAssignModal(null)} />
            </div>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Search employee by name or dept..." 
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '10px', 
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {employees
                .filter(emp => 
                  emp.full_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || 
                  emp.department?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                  emp.designation?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
                )
                .map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => handleAssign(emp.id)}
                  style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <p style={{ margin: 0, fontWeight: 700 }}>{emp.full_name}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{emp.designation} • {emp.department}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '600px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Bulk Import Resources</h2>
              <XCircle size={24} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowBulkModal(false)} />
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Enter email addresses or phone numbers (one per line). <br/>
              Format: <code>Email, example@company.com</code> or just <code>example@company.com</code>
            </p>
            <textarea 
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder="example1@company.com&#10;9876543210&#10;Email, example2@company.com"
              style={{ width: '100%', height: '300px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'none' }}
            />
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button onClick={handleBulkImport} className="btn-primary" style={{ flex: 1 }}>Import All</button>
              <button onClick={() => setShowBulkModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bucket;
