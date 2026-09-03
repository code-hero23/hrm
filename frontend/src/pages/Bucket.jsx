import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
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
  Activity,
  Download,
  FileSpreadsheet,
  FileText,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import API_BASE_URL from '../config';

const Bucket = ({ user }) => {
  const [resources, setResources] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(null); // resource ID
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Single Add Form State
  const [newResourceType, setNewResourceType] = useState('Email');
  const [newResourceValue, setNewResourceValue] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add State
  const [quickAddValue, setQuickAddValue] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Export State
  const [exportScope, setExportScope] = useState('current');
  const [exportFormat, setExportFormat] = useState('xlsx');

  // Bulk State
  const [bulkData, setBulkData] = useState('');
  const [bulkError, setBulkError] = useState('');

  // Search & Filter State
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Email');

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      showToast('Error loading resource bucket', 'error');
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

  const validateResource = (type, val) => {
    const clean = val.trim();
    if (!clean) return 'Value cannot be empty.';
    if (type === 'Email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clean)) {
        return 'Please enter a valid email address (e.g. name@company.com).';
      }
    } else if (type === 'Phone') {
      const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
      if (!phoneRegex.test(clean)) {
        return 'Please enter a valid phone number (at least 7 digits).';
      }
    }
    return null;
  };

  const handleOpenAddModal = (initialType = activeTab) => {
    setNewResourceType(initialType);
    setNewResourceValue('');
    setAddError('');
    setAddSuccess('');
    setShowAddModal(true);
  };

  const handleAddResource = async (closeAfter = true) => {
    setAddError('');
    setAddSuccess('');
    const validationErr = validateResource(newResourceType, newResourceValue);
    if (validationErr) {
      setAddError(validationErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/bucket`, {
        type: newResourceType,
        value: newResourceValue.trim()
      });

      fetchData();
      showToast(`${newResourceType} "${newResourceValue.trim()}" added to bucket!`, 'success');

      if (closeAfter) {
        setShowAddModal(false);
        setNewResourceValue('');
      } else {
        setAddSuccess(`${newResourceType} added successfully! You can add another below.`);
        setNewResourceValue('');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to add resource.';
      setAddError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;

    const validationErr = validateResource(activeTab, quickAddValue);
    if (validationErr) {
      showToast(validationErr, 'error');
      return;
    }

    setIsQuickAdding(true);
    try {
      await axios.post(`${API_BASE_URL}/api/bucket`, {
        type: activeTab,
        value: quickAddValue.trim()
      });
      setQuickAddValue('');
      fetchData();
      showToast(`${activeTab} "${quickAddValue.trim()}" added!`, 'success');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to add resource.';
      showToast(errMsg, 'error');
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleBulkImport = async () => {
    setBulkError('');
    try {
      const lines = bulkData.split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        setBulkError('Please enter at least one item to import.');
        return;
      }

      const payload = lines.map(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const type = parts[0].trim().toLowerCase() === 'phone' ? 'Phone' : 'Email';
          return { type, value: parts.slice(1).join(',').trim() };
        }
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
      showToast(`Bulk imported ${payload.length} items successfully!`, 'success');
    } catch (err) {
      setBulkError(err.response?.data?.error || err.message || 'Bulk import failed');
    }
  };

  const handleAssign = async (employeeId) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/bucket/${showAssignModal}/assign`, { assigned_to: employeeId });
      setShowAssignModal(null);
      fetchData();
      showToast('Resource assigned successfully!', 'success');
    } catch (err) {
      showToast('Assignment failed', 'error');
    }
  };

  const handleUnassign = async (id) => {
    if (!window.confirm('Are you sure you want to unassign this resource?')) return;
    try {
      await axios.patch(`${API_BASE_URL}/api/bucket/${id}/unassign`);
      fetchData();
      showToast('Resource unassigned successfully!', 'success');
    } catch (err) {
      showToast('Unassignment failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource permanently?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/bucket/${id}`);
      fetchData();
      showToast('Resource deleted permanently', 'success');
    } catch (err) {
      showToast('Deletion failed', 'error');
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesTab = r.type.toLowerCase() === activeTab.toLowerCase();
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesSearch = r.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.assigned_to_name && r.assigned_to_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesStatus && matchesSearch;
  });

  const executeExport = (scope = exportScope, format = exportFormat) => {
    let dataset = [];
    let fileScopeName = 'Export';

    if (scope === 'current') {
      dataset = filteredResources;
      fileScopeName = `${activeTab}s_Filtered`;
    } else if (scope === 'tab_all') {
      dataset = resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase());
      fileScopeName = `All_${activeTab}s`;
    } else if (scope === 'all_emails') {
      dataset = resources.filter(r => r.type.toLowerCase() === 'email');
      fileScopeName = 'All_Emails';
    } else if (scope === 'all_phones') {
      dataset = resources.filter(r => r.type.toLowerCase() === 'phone');
      fileScopeName = 'All_Phones';
    } else {
      dataset = resources;
      fileScopeName = 'All_Resources';
    }

    if (dataset.length === 0) {
      alert('No resources available to export for the selected scope.');
      return;
    }

    const rowsToExport = dataset.map((item, index) => ({
      'S.No': index + 1,
      'Resource ID': item.id,
      'Resource Type': item.type,
      'Resource Value': item.value,
      'Status': item.status,
      'Assigned Employee': item.assigned_to_name || 'Unassigned',
      'Assigned Date': item.assigned_date || 'N/A'
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Resource_Bucket_${fileScopeName}_${dateStr}`;

    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);

    // Auto calculate column widths
    worksheet['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 14 }, // Resource ID
      { wch: 16 }, // Resource Type
      { wch: 34 }, // Resource Value
      { wch: 14 }, // Status
      { wch: 26 }, // Assigned Employee
      { wch: 16 }  // Assigned Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resource Bucket');

    if (format === 'csv') {
      XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx' });
    }

    setShowExportModal(false);
    showToast(`Exported ${dataset.length} records to ${format.toUpperCase()}`, 'success');
  };

  if (loading) return <div className="p-8 text-center text-white" style={{ padding: '4rem', fontSize: '1.25rem' }}>Loading Resource Bucket...</div>;

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
          <X size={16} style={{ cursor: 'pointer', marginLeft: '0.5rem', opacity: 0.8 }} onClick={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <Database size={36} className="text-accent" /> Resource Bucket
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', marginTop: '0.4rem' }}>
            Central inventory to add, assign, manage, and export company official emails & phone numbers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {user?.role !== 'viewer' && (
            <>
              <button 
                onClick={() => handleOpenAddModal(activeTab)}
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontWeight: 700 }}
              >
                <Plus size={18} /> Add {activeTab === 'Email' ? 'Email' : 'Phone'}
              </button>

              <button 
                onClick={() => setShowBulkModal(true)}
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
              >
                <Upload size={18} /> Bulk Import
              </button>
            </>
          )}

          <button 
            onClick={() => setShowExportModal(true)}
            className="btn btn-secondary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem 1.25rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              color: '#60a5fa'
            }}
          >
            <Download size={18} /> Export Data
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        {[
          { key: 'Email', label: 'Official Emails', icon: Mail, count: resources.filter(r => r.type.toLowerCase() === 'email').length },
          { key: 'Phone', label: 'Phone Numbers', icon: Phone, count: resources.filter(r => r.type.toLowerCase() === 'phone').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.875rem 1.75rem',
              borderRadius: '12px',
              border: activeTab === tab.key ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              background: activeTab === tab.key ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab.key ? 'white' : 'var(--text-dim)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              boxShadow: activeTab === tab.key ? '0 4px 20px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            <span style={{ 
              fontSize: '0.75rem', 
              background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              padding: '2px 8px',
              borderRadius: '10px',
              marginLeft: '0.25rem'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { label: `Total ${activeTab}s`, value: resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase()).length, icon: Database, color: '#3b82f6' },
          { label: 'Available', value: resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase() && r.status === 'Available').length, icon: CheckCircle, color: '#22c55e' },
          { label: 'Assigned', value: resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase() && r.status === 'Assigned').length, icon: Activity, color: '#f59e0b' }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: `${stat.color}18`, padding: '0.875rem', borderRadius: '12px', border: `1px solid ${stat.color}30` }}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Bar (Non-viewers only) */}
      {user?.role !== 'viewer' && (
        <form onSubmit={handleQuickAdd} className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.875rem', minWidth: '120px' }}>
            {activeTab === 'Email' ? <Mail size={16} /> : <Phone size={16} />}
            <span>Quick Add:</span>
          </div>
          <input 
            type={activeTab === 'Email' ? 'email' : 'text'}
            placeholder={activeTab === 'Email' ? 'e.g. employee.name@company.com' : 'e.g. +1 (555) 019-2834 or 9876543210'}
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '10px', 
              padding: '0.625rem 1rem', 
              color: 'white',
              fontSize: '0.9rem'
            }}
          />
          <button 
            type="submit" 
            disabled={isQuickAdding || !quickAddValue.trim()} 
            className="btn btn-primary" 
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: isQuickAdding || !quickAddValue.trim() ? 0.6 : 1 }}
          >
            <Plus size={16} /> {isQuickAdding ? 'Adding...' : 'Add Now'}
          </button>
        </form>
      )}

      {/* Control Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab.toLowerCase()} or assigned employee...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '12px', 
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              color: 'white',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={18} className="text-dim" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              color: 'white', 
              border: '1px solid var(--glass-border)', 
              padding: '0.75rem 1.25rem', 
              borderRadius: '12px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Status ({resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase()).length})</option>
            <option value="Available">Available ({resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase() && r.status === 'Available').length})</option>
            <option value="Assigned">Assigned ({resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase() && r.status === 'Assigned').length})</option>
          </select>
        </div>

        <button 
          onClick={() => executeExport('current', 'xlsx')}
          className="btn btn-secondary"
          title="Quick export current table view to Excel"
          style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileSpreadsheet size={16} className="text-accent" /> Quick Excel ({filteredResources.length})
        </button>
      </div>

      {/* Resource Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTab} Value</th>
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Employee</th>
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '50%' }}>
                        {activeTab === 'Email' ? <Mail size={32} style={{ opacity: 0.4 }} /> : <Phone size={32} style={{ opacity: 0.4 }} />}
                      </div>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No {activeTab.toLowerCase()}s found</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        {searchTerm || filterStatus !== 'All' 
                          ? 'Try adjusting your search or filters' 
                          : `Get started by clicking "+ Add ${activeTab}" or using Quick Add above.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredResources.map(resource => (
                <tr 
                  key={resource.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} 
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} 
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '10px' }}>
                        {resource.type.toLowerCase() === 'email' ? <Mail size={18} className="text-accent" /> : <Phone size={18} className="text-accent" />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.975rem' }}>{resource.value}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: #{resource.id} • {resource.type}</p>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      padding: '4px 10px', 
                      borderRadius: '20px',
                      background: resource.status === 'Available' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: resource.status === 'Available' ? '#22c55e' : '#f59e0b',
                      border: `1px solid ${resource.status === 'Available' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: resource.status === 'Available' ? '#22c55e' : '#f59e0b' }}></span>
                      {resource.status}
                    </span>
                  </td>

                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    {resource.status === 'Assigned' ? (
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{resource.assigned_to_name || 'System Employee'}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>Assigned on {resource.assigned_date || 'N/A'}</p>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.7 }}>Unassigned</span>
                    )}
                  </td>

                  <td style={{ padding: '1.1rem 1.5rem', textAlign: 'right' }}>
                    {user?.role !== 'viewer' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {resource.status === 'Available' ? (
                          <button 
                            onClick={() => setShowAssignModal(resource.id)}
                            className="btn btn-primary" 
                            style={{ padding: '0.45rem 0.875rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <UserPlus size={14} /> Assign
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUnassign(resource.id)}
                            style={{ padding: '0.45rem 0.875rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          >
                            <XCircle size={14} /> Unassign
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(resource.id)}
                          title="Delete resource"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.6rem', borderRadius: '10px' }}>
                  <Plus size={22} className="text-accent" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Add New Resource</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Register an official company email or phone</p>
                </div>
              </div>
              <XCircle size={22} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowAddModal(false)} />
            </div>

            {addError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} />
                <span>{addSuccess}</span>
              </div>
            )}

            {/* Type selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Resource Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setNewResourceType('Email'); setAddError(''); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: newResourceType === 'Email' ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                    background: newResourceType === 'Email' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: newResourceType === 'Email' ? 'white' : 'var(--text-dim)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Mail size={16} className={newResourceType === 'Email' ? 'text-accent' : ''} /> Official Email
                </button>

                <button
                  type="button"
                  onClick={() => { setNewResourceType('Phone'); setAddError(''); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: newResourceType === 'Phone' ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                    background: newResourceType === 'Phone' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: newResourceType === 'Phone' ? 'white' : 'var(--text-dim)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Phone size={16} className={newResourceType === 'Phone' ? 'text-accent' : ''} /> Phone Number
                </button>
              </div>
            </div>

            {/* Input field */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                {newResourceType === 'Email' ? 'Official Email Address' : 'Phone Number'}
              </label>
              <input 
                type={newResourceType === 'Email' ? 'email' : 'text'}
                placeholder={newResourceType === 'Email' ? 'e.g. employee@company.com' : 'e.g. +1 (555) 234-5678 or 9876543210'}
                value={newResourceValue}
                onChange={(e) => { setNewResourceValue(e.target.value); setAddError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddResource(true); }}
                autoFocus
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '10px', 
                  padding: '0.85rem 1rem', 
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => handleAddResource(false)}
                disabled={isSubmitting || !newResourceValue.trim()}
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.85rem', fontSize: '0.875rem' }}
              >
                Add & Another
              </button>

              <button 
                type="button" 
                onClick={() => handleAddResource(true)}
                disabled={isSubmitting || !newResourceValue.trim()}
                className="btn btn-primary" 
                style={{ flex: 1.2, padding: '0.85rem', fontSize: '0.875rem' }}
              >
                {isSubmitting ? 'Saving...' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.6rem', borderRadius: '10px' }}>
                  <Download size={22} className="text-accent" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Export Resource Bucket</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Download spreadsheet reports of company assets</p>
                </div>
              </div>
              <XCircle size={22} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowExportModal(false)} />
            </div>

            {/* Scope Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Select Export Scope</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { id: 'current', title: `Current View (${activeTab}s - Filtered)`, count: filteredResources.length, desc: `Matching search "${searchTerm || 'All'}" & status "${filterStatus}"` },
                  { id: 'tab_all', title: `All ${activeTab}s`, count: resources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase()).length, desc: `Complete list of ${activeTab.toLowerCase()} resources` },
                  { id: 'all_emails', title: 'All Official Emails', count: resources.filter(r => r.type.toLowerCase() === 'email').length, desc: 'Every registered company email address' },
                  { id: 'all_phones', title: 'All Phone Numbers', count: resources.filter(r => r.type.toLowerCase() === 'phone').length, desc: 'Every registered company phone number' },
                  { id: 'all', title: 'Full Resource Bucket', count: resources.length, desc: 'All emails and phones across the company' }
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setExportScope(opt.id)}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '10px',
                      border: exportScope === opt.id ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                      background: exportScope === opt.id ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.925rem', color: exportScope === opt.id ? 'white' : 'var(--text)' }}>{opt.title}</p>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>{opt.desc}</p>
                    </div>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 800, 
                      padding: '3px 10px', 
                      borderRadius: '12px',
                      background: exportScope === opt.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                      color: 'white'
                    }}>
                      {opt.count} items
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>File Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setExportFormat('xlsx')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: exportFormat === 'xlsx' ? '1px solid #10b981' : '1px solid var(--glass-border)',
                    background: exportFormat === 'xlsx' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: exportFormat === 'xlsx' ? 'white' : 'var(--text-dim)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileSpreadsheet size={16} className={exportFormat === 'xlsx' ? 'text-emerald-400' : ''} /> Excel Workbook (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: exportFormat === 'csv' ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                    background: exportFormat === 'csv' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: exportFormat === 'csv' ? 'white' : 'var(--text-dim)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileText size={16} className={exportFormat === 'csv' ? 'text-accent' : ''} /> CSV File (.csv)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowExportModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.85rem' }}>Cancel</button>
              <button onClick={() => executeExport()} className="btn btn-primary" style={{ flex: 1.5, padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Download size={18} /> Download {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Assign to Employee</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Select an employee from the organization</p>
              </div>
              <XCircle size={22} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowAssignModal(null)} />
            </div>

            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Search employee by name, designation, department..." 
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '10px', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
              {employees
                .filter(emp => 
                  emp.full_name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || 
                  emp.department?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                  emp.designation?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
                )
                .map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => handleAssign(emp.id)}
                  style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{emp.full_name}</p>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {emp.designation || 'Staff'} • {emp.department || 'General'}
                    </p>
                  </div>
                  <UserPlus size={16} className="text-accent" style={{ opacity: 0.8 }} />
                </div>
              ))}

              {employees.filter(emp => 
                emp.full_name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || 
                emp.department?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                emp.designation?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
              ).length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No matching employees found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.6rem', borderRadius: '10px' }}>
                  <Upload size={22} className="text-accent" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Bulk Import Resources</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Add multiple emails or phone numbers at once</p>
                </div>
              </div>
              <XCircle size={22} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowBulkModal(false)} />
            </div>

            {bulkError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{bulkError}</span>
              </div>
            )}

            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Enter email addresses or phone numbers (one per line). <br/>
              Format: <code>Email, name@company.com</code> or <code>Phone, +1 555-1234</code> or simply <code>name@company.com</code>
            </p>

            <textarea 
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder={`alex.morgan@company.com\nEmail, support@company.com\n9876543210\nPhone, +1 555-0199`}
              style={{ width: '100%', height: '240px', background: 'rgba(0,0,0,0.25)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'none' }}
            />

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowBulkModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleBulkImport} className="btn btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Upload size={18} /> Import All Lines
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bucket;
