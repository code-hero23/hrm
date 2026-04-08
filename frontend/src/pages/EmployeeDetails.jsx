import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, Download, ArrowLeft, Trash2, CheckCircle, UserCircle, Edit3, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_BASE_URL from '../config';
import LifecycleTracker from '../components/LifecycleTracker';

const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const StatusDropdown = ({ currentStatus, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const statuses = [
    { value: 'New', label: 'New', color: '#22d3ee' },
    { value: 'Trainee', label: 'Trainee', color: '#3b82f6' },
    { value: 'Onboard', label: 'Onboard', color: '#eab308' },
    { value: 'Current Employee', label: 'Current Employee', color: '#22c55e' },
    { value: 'Bix Employee', label: 'Bix Employee', color: '#8b5cf6' },
    { value: 'Bench', label: 'Bench (NP)', color: '#f97316' },
    { value: 'Resigned', label: 'Resigned', color: '#ef4444' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: '180px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="card"
        style={{ 
          padding: '0.6rem 1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1rem', 
          background: 'rgba(255,255,255,0.05)',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--glass-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statuses.find(s => s.value === currentStatus)?.color || '#ccc' }}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{currentStatus}</span>
        </div>
        <ChevronRight size={16} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} />
      </button>

      {isOpen && (
        <div className="card slide-in" style={{ 
          position: 'absolute', 
          top: '110%', 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          padding: '0.5rem',
          background: '#1e293b',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          border: '1px solid var(--glass-border)'
        }}>
          {statuses.map(s => (
            <div 
              key={s.value}
              onClick={() => { onUpdate(s.value); setIsOpen(false); }}
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: '0.2s',
                background: currentStatus === s.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: currentStatus === s.value ? '#60a5fa' : 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = currentStatus === s.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }}></div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 1. Reusable helper to process Image OR PDF to a high-quality Canvas/Image
const processDocToImage = async (path) => {
  const fullUrl = `${API_BASE_URL || window.location.origin}${path}`;
  const isPdf = path.toLowerCase().endsWith('.pdf');

  try {
    if (isPdf) {
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => {
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
          };
        });
      }

      const loadingTask = window.pdfjsLib.getDocument(fullUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2.0 }); // High res
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      return { data: canvas.toDataURL('image/jpeg', 0.9), type: 'JPEG' };
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = fullUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return { data: canvas.toDataURL('image/jpeg', 0.9), type: 'JPEG' };
    }
  } catch (err) {
    console.error('Error processing document:', path, err);
    return null;
  }
};

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingOJ, setIsEditingOJ] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees/${id}`);
      setEmployee(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/employees/${id}`, { status: newStatus });
      fetchEmployee();
    } catch (err) {
      console.error(err);
    }
  };

  const updateOfficialJoiningDate = async (newDate) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/employees/${id}`, { official_joining_date: newDate });
      setEmployee(prev => ({ ...prev, official_joining_date: newDate }));
      setIsEditingOJ(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update date');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this employee record? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/employees/${id}`);
        alert('Employee record deleted successfully');
        navigate('/');
      } catch (err) {
        console.error(err);
        alert('Error deleting employee record');
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const element = printRef.current;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 1. Capture Main Profile (Multi-page capture)
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const imgHeightInPdf = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position -= pdfHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }

      // 2. Append all Document Proofs (Full-page sequential append)
      const docsToAppend = [
        { label: 'PAN CARD', path: employee.pan_card_path },
        { label: 'AADHAAR CARD', path: employee.aadhaar_card_path },
        { label: 'BANK PASSBOOK', path: employee.bank_passbook_path },
        { label: 'EDUCATIONAL CERTIFICATE', path: employee.educational_certificate_path }
      ].filter(d => d.path);

      for (const doc of docsToAppend) {
        const processed = await processDocToImage(doc.path);
        if (processed) {
          pdf.addPage();
          // Title for the document page
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text(`DOCUMENT PROOF: ${doc.label}`, 10, 15);
          pdf.setDrawColor(200, 200, 200);
          pdf.line(10, 18, 200, 18);

          // Add the image (maintaining aspect ratio, fitting centered)
          const imgProps = pdf.getImageProperties(processed.data);
          const ratio = Math.min((pdfWidth - 20) / imgProps.width, (pdfHeight - 40) / imgProps.height);
          const dw = imgProps.width * ratio;
          const dh = imgProps.height * ratio;
          const dx = (pdfWidth - dw) / 2;
          const dy = 30; // Start below title

          pdf.addImage(processed.data, processed.type, dx, dy, dw, dh);
        }
      }
      
      pdf.save(`Employee_Report_${employee.full_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Error creating PDF report. Please try again.');
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'4rem'}}>Loading record...</div>;
  if (!employee) return <div style={{textAlign:'center', padding:'4rem'}}>Employee not found.</div>;

  const handleLifecycleUpdate = async (newSteps) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/employees/${id}`, { lifecycle_steps: JSON.stringify(newSteps) });
      setEmployee(prev => ({ ...prev, lifecycle_steps: JSON.stringify(newSteps) }));
    } catch (err) {
      console.error('Failed to update lifecycle steps:', err);
    }
  };

  const isNA = (val) => {
    if (!val) return true;
    const s = String(val).trim().toUpperCase();
    return s === 'N/A' || s === 'N/A(-)' || s === 'N/A(' || s === '—' || s === '-';
  };

  return (
    <div className="slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ border: 'none', background: 'transparent' }}>
          <ArrowLeft size={20} /> <span style={{fontWeight: 700}}>Back to Workforce</span>
        </button>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={handleDelete} className="btn btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <Trash2 size={18} /> Delete Record
          </button>
          <button onClick={() => navigate(`/edit-employee/${id}`)} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', border: 'none' }}>
            <Edit3 size={18} /> Edit Profile
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-secondary">
            <Download size={18} /> Export PDF
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>UPDATE STATUS:</span>
             <StatusDropdown currentStatus={employee.status} onUpdate={updateStatus} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
          <div style={{ width: '180px', height: '220px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            {employee.photo_path ? (
              <img src={`${API_BASE_URL}${employee.photo_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <UserCircle size={64} />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{employee.full_name}</h2>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-dim)', fontWeight: 500, marginTop: '0.25rem' }}>{employee.designation} • {employee.department}</p>
              </div>
              <span className={`badge badge-${employee.status.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '0.875rem' }}>{employee.status}</span>
            </div>
            
            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <div>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>EMPLOYEE ID</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>{employee.employee_id || 'PENDING'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>FILE NO.</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>{employee.file_no || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>D.O.J</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>{formatDate(employee.date_of_joining) || 'N/A'}</p>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '12px', background: isEditingOJ ? 'rgba(59, 130, 246, 0.1)' : 'transparent', transition: '0.3s' }}>
                <p style={{ fontSize: '0.625rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  OFFICIAL D.O.J
                  {!isEditingOJ && <Edit3 size={12} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setIsEditingOJ(true)} />}
                </p>
                {isEditingOJ ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      defaultValue={employee.official_joining_date || ''} 
                      className="form-group input" 
                      style={{ padding: '4px 8px', fontSize: '0.875rem', width: 'auto' }}
                      onBlur={(e) => updateOfficialJoiningDate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateOfficialJoiningDate(e.target.value);
                        if (e.key === 'Escape') setIsEditingOJ(false);
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#60a5fa', cursor: 'pointer' }} onClick={() => setIsEditingOJ(true)}>
                    {formatDate(employee.official_joining_date) || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {(() => {
          const steps = employee.lifecycle_steps ? (typeof employee.lifecycle_steps === 'string' ? JSON.parse(employee.lifecycle_steps) : employee.lifecycle_steps) : [];
          const total = steps.length || 20;
          const done = steps.filter(s => s.done).length;
          const progress = Math.round((done / total) * 100);
          const risk = progress < 40 && total > 0;
          
          return (
            <div style={{ marginBottom: '2.5rem', animation: 'fadeIn 0.8s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: progress === 100 ? '#22c55e' : (risk ? '#ef4444' : '#3b82f6'), boxShadow: `0 0 10px ${progress === 100 ? '#22c55e' : (risk ? '#ef4444' : '#3b82f6')}` }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    Onboarding Completion
                  </span>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: progress === 100 ? '#4ade80' : 'white' }}>
                  {progress}<span style={{ fontSize: '0.75rem', opacity: 0.5, marginLeft: '2px' }}>%</span>
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: progress === 100 
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
                    : risk ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: progress > 0 ? `0 0 15px ${risk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` : 'none'
                }} />
              </div>
            </div>
          );
        })()}

        <LifecycleTracker 
          employeeId={id} 
          initialSteps={employee.lifecycle_steps} 
          doj={employee.date_of_joining} 
          onUpdate={handleLifecycleUpdate} 
        />

        <div className="section-title">Identity & Contacts</div>
        <div className="form-grid">
          <div className="form-group"><label>Date of Birth</label><p style={{fontSize: '1rem', fontWeight: 500}}>{formatDate(employee.dob) || '—'}</p></div>
          <div className="form-group"><label>Gender</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.gender || '—'}</p></div>
          <div className="form-group"><label>Contact</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.contact_number || '—'}</p></div>
          <div className="form-group"><label>Email</label><p style={{fontSize: '1.1rem', fontWeight: 500, textTransform: 'none', color: '#60a5fa'}}>{employee.personal_email || '—'}</p></div>
          <div className="form-group"><label>PAN</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.pan_number || '—'}</p></div>
          <div className="form-group"><label>Aadhaar</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.aadhaar_number || '—'}</p></div>
          <div className="form-group"><label>Father Name</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.father_name || '—'}</p></div>
          <div className="form-group"><label>Mother Name</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.mother_name || '—'}</p></div>
        </div>

        <div className="section-title">Bank Information</div>
        <div className="form-grid">
          <div className="form-group"><label>A/C Holder</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.account_holder_name || '—'}</p></div>
          <div className="form-group"><label>A/C Number</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.account_number || '—'}</p></div>
          <div className="form-group"><label>IFSC Code</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.ifsc_code || '—'}</p></div>
          <div className="form-group"><label>Bank & Branch</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.bank_name ? `${employee.bank_name} - ${employee.branch}` : '—'}</p></div>
        </div>

        <div className="section-title">Office Assets & Systems (Optional)</div>
        <div className="form-grid">
          <div className="form-group"><label>{employee.check_sim === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}Office SIM (Optional)</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.office_sim || '—'} {employee.office_sim_date && `(Allocated: ${formatDate(employee.office_sim_date)})`}</p></div>
          <div className="form-group"><label>{employee.check_laptop === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}Laptop/System (Optional)</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.laptop_system || '—'} {employee.laptop_system_date && `(Allocated: ${formatDate(employee.laptop_system_date)})`}</p></div>
          <div className="form-group"><label>{employee.check_official_mail === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}Official Mail ID</label><p style={{fontSize: '1rem', fontWeight: 500, textTransform:'none'}}>{employee.asset_official_mail || '—'}</p></div>
          <div className="form-group"><label>{employee.check_crm === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}CRM (Asset)</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.asset_crm || '—'}</p></div>
          <div className="form-group"><label>{employee.check_peopledesk === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}Peopledesk</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.asset_peopledesk || '—'}</p></div>
          <div className="form-group"><label>{employee.check_projects === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}Projects</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.asset_projects || '—'}</p></div>
          <div className="form-group"><label>{employee.check_id_card === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}ID Card</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.asset_id_card || '—'}</p></div>
          <div className="form-group"><label>{employee.check_offer_letter === 1 && <span style={{color:'#22c55e', marginRight:'5px'}}>✓</span>}Offer Letter</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.asset_offer_letter || '—'}</p></div>
        </div>

        <div className="section-title">Background Verification Details</div>
        {employee.background_verification ? (() => {
          try {
            const bgc = JSON.parse(employee.background_verification);
            return (
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <p style={{fontSize:'0.9rem', color:'#60a5fa', marginBottom:'1rem', fontWeight:700}}>TYPE: {bgc.type || 'N/A'}</p>
                
                {bgc.type === 'FRESHER' && bgc.educational && (
                  <div style={{marginBottom:'1rem'}}>
                    <h5 style={{fontSize:'0.75rem', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'0.5rem'}}>Educational Verification</h5>
                    <p style={{fontSize:'0.875rem'}}><strong>College:</strong> {bgc.educational.college}</p>
                    <p style={{fontSize:'0.875rem'}}><strong>HOD/Lecturer:</strong> {bgc.educational.hod} ({bgc.educational.mobile})</p>
                    <p style={{fontSize:'0.875rem'}}><strong>Email:</strong> {bgc.educational.email}</p>
                  </div>
                )}

                {bgc.type === 'EXPERIENCED' && bgc.company && (
                  <div style={{marginBottom:'1rem'}}>
                    <h5 style={{fontSize:'0.75rem', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'0.5rem'}}>Previous Company Verification</h5>
                    {bgc.company.manager_name && (
                      <p style={{fontSize:'0.875rem'}}><strong>Manager:</strong> {bgc.company.manager_name} ({bgc.company.manager_contact}) • {bgc.company.manager_email}</p>
                    )}
                    {bgc.company.hr_name && (
                      <p style={{fontSize:'0.875rem'}}><strong>HR:</strong> {bgc.company.hr_name} ({bgc.company.hr_contact}) • {bgc.company.hr_email}</p>
                    )}
                  </div>
                )}

                <div className="form-grid" style={{marginTop:'1.5rem'}}>
                  <div>
                    <h5 style={{fontSize:'0.75rem', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'0.5rem'}}>House Verification ({bgc.address?.house_type})</h5>
                    {bgc.address?.house_type === 'OWN' && <p style={{fontSize:'0.875rem'}}><strong>Neighbour:</strong> {bgc.address.neighbour_name} ({bgc.address.neighbour_contact})</p>}
                    {bgc.address?.house_type === 'RENT' && <p style={{fontSize:'0.875rem'}}><strong>Owner:</strong> {bgc.address.owner_name} ({bgc.address.owner_contact})</p>}
                    {bgc.address?.house_type === 'PG' && <p style={{fontSize:'0.875rem'}}><strong>PG Manager:</strong> {bgc.address.pg_manager} ({bgc.address.pg_contact})</p>}
                    <p style={{fontSize:'0.875rem', marginTop:'0.5rem'}}><strong>Current Address Verified:</strong> {bgc.address?.current_address}</p>
                  </div>
                  <div>
                    <h5 style={{fontSize:'0.75rem', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'0.5rem'}}>Personal References</h5>
                    <p style={{fontSize:'0.875rem'}}><strong>Friend:</strong> {bgc.friend?.name} ({bgc.friend?.designation}) • {bgc.friend?.contact}</p>
                    <p style={{fontSize:'0.875rem'}}><strong>Relative:</strong> {bgc.relative?.name} ({bgc.relative?.designation}) • {bgc.relative?.contact}</p>
                    <p style={{fontSize:'0.875rem'}}><strong>Father Mobile:</strong> {employee.father_mobile || employee.father_husband_number || '—'}</p>
                    <p style={{fontSize:'0.875rem'}}><strong>Mother Mobile:</strong> {employee.mother_mobile || employee.mother_wife_number || '—'}</p>
                  </div>
                </div>
              </div>
            );
          } catch(e) { return <p>Error parsing verification data</p>; }
        })() : <p style={{padding:'1rem', color:'var(--text-dim)'}}>No background verification data available.</p>}

        <div className="section-title">Supporting Documents</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Bank Passbook</label>
            {employee.bank_passbook_path ? <a href={`${API_BASE_URL}${employee.bank_passbook_path}`} target="_blank" rel="noreferrer" className="badge badge-current-employee">View Document</a> : <p>—</p>}
          </div>
          <div className="form-group">
            <label>PAN Card</label>
            {employee.pan_card_path ? <a href={`${API_BASE_URL}${employee.pan_card_path}`} target="_blank" rel="noreferrer" className="badge badge-current-employee">View Document</a> : <p>—</p>}
          </div>
          <div className="form-group">
            <label>Aadhaar Card</label>
            {employee.aadhaar_card_path ? <a href={`${API_BASE_URL}${employee.aadhaar_card_path}`} target="_blank" rel="noreferrer" className="badge badge-current-employee">View Document</a> : <p>—</p>}
          </div>
          <div className="form-group">
            <label>Educational Certificate</label>
            {employee.educational_certificate_path ? <a href={`${API_BASE_URL}${employee.educational_certificate_path}`} target="_blank" rel="noreferrer" className="badge badge-current-employee">View Document</a> : <p>—</p>}
          </div>
        </div>

        {employee.documents_passwords && (
          <div className="form-group" style={{marginTop:'1.5rem'}}>
            <label>Document Passwords</label>
            <p style={{fontSize:'0.9rem', color:'#60a5fa', background:'rgba(59, 130, 246, 0.1)', padding:'1rem', borderRadius:'8px', border:'1px solid rgba(59, 130, 246, 0.2)'}}>
              {employee.documents_passwords}
            </p>
          </div>
        )}
      </div>


      {/* Hidden PDF content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef} style={{ width: '210mm', padding: '15mm', background: 'white', color: 'black', fontFamily: 'serif', fontSize: '10pt' }}>
          <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '2px solid black', paddingBottom: '4mm' }}>
            <h1 style={{ fontSize: '22pt', margin: 0 }}>ORBIX DESIGNS PRIVATE LIMITED</h1>
            <h2 style={{ fontSize: '14pt', marginTop: '2mm', letterSpacing: '2px' }}>OFFICIAL EMPLOYEE RECORD</h2>
            <p style={{ fontSize: '8pt', marginTop: '2mm', color: '#666' }}>DB Record ID: {employee.id} | System Entry: {new Date(employee.created_at).toLocaleString()}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10mm', marginBottom: '8mm' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>I. PERSONAL INFORMATION</h3>
              <p><strong>Full Name:</strong> {employee.full_name}</p>
              <p><strong>Father Name:</strong> {employee.father_name || employee.father_mother_name}</p>
              <p><strong>Mother Name:</strong> {employee.mother_name || '—'}</p>
              <p><strong>DOB:</strong> {formatDate(employee.dob)} &nbsp;&nbsp; <strong>Gender:</strong> {employee.gender}</p>
              <p><strong>Blood Group:</strong> {employee.blood_group} &nbsp;&nbsp; <strong>Marital Status:</strong> {employee.marital_status}</p>
              <p><strong>Contact No:</strong> {employee.contact_number}</p>
              <p><strong>Personal Email:</strong> {employee.personal_email}</p>
              <p><strong>Present Address:</strong> {employee.present_address}</p>
              <p><strong>Permanent Address:</strong> {employee.permanent_address}</p>
            </div>
              <div style={{ width: '40mm', textAlign: 'right' }}>
               {employee.photo_path ? (
                 <img src={`${API_BASE_URL || window.location.origin}${employee.photo_path}`} crossOrigin="anonymous" style={{ width: '35mm', height: '45mm', border: '1px solid black', objectFit: 'cover' }} />
               ) : (
                 <div style={{ width: '35mm', height: '45mm', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8pt' }}>NO PHOTO</div>
               )}
            </div>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>II. EMPLOYMENT DETAILS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '1.5mm 0', width: '50%' }}><strong>Employee ID:</strong> {employee.employee_id || '—'}</td>
                  <td style={{ padding: '1.5mm 0', width: '50%' }}><strong>File No:</strong> {employee.file_no || '—'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.5mm 0' }}><strong>Status:</strong> {employee.status}</td>
                  <td style={{ padding: '1.5mm 0' }}><strong>Department:</strong> {employee.department}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.5mm 0' }}><strong>Designation:</strong> {employee.designation}</td>
                  <td style={{ padding: '1.5mm 0' }}><strong>Work Location:</strong> {employee.work_location}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.5mm 0' }}><strong>Date of Joining:</strong> {formatDate(employee.date_of_joining)}</td>
                  <td style={{ padding: '1.5mm 0' }}><strong>Official Join Date:</strong> {formatDate(employee.official_joining_date) || '—'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.5mm 0' }} colSpan="2"><strong>Reporting Manager:</strong> {employee.reporting_manager || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>III. IDENTIFICATION & EMERGENCY CONTACT</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2mm', marginBottom: '2mm' }}>
              <p><strong>PAN Number:</strong> {employee.pan_number}</p>
              <p><strong>Aadhaar Number:</strong> {employee.aadhaar_number}</p>
              <p><strong>Other ID:</strong> {employee.other_id || '—'}</p>
            </div>
            <div style={{ background: '#f9f9f9', padding: '3mm', border: '1px solid #eee', borderRadius: '4px' }}>
              <p style={{ marginBottom: '1.5mm' }}><strong>Emergency Contact:</strong> {employee.emergency_contact_name} ({employee.emergency_contact_relationship}) - <span style={{ color: '#2563eb' }}>{employee.emergency_contact_number}</span></p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2mm', fontSize: '9pt' }}>
                <p><strong>Father Mobile:</strong> {employee.father_mobile || employee.father_husband_number}</p>
                <p><strong>Mother Mobile:</strong> {employee.mother_mobile || employee.mother_wife_number}</p>
                <p><strong>Alternate No:</strong> {employee.alternate_number}</p>
              </div>
            </div>
            {employee.documents_passwords && (
              <p style={{ marginTop: '2mm', fontSize: '9pt', color: '#dc2626' }}><strong>⚠️ Document Passwords:</strong> {employee.documents_passwords}</p>
            )}
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>IV. BANK & EDUCATION</h3>
            <p><strong>Bank Name:</strong> {employee.bank_name} &nbsp;&nbsp; <strong>Branch:</strong> {employee.branch}</p>
            <p><strong>A/C Holder:</strong> {employee.account_holder_name} &nbsp;&nbsp; <strong>A/C No:</strong> {employee.account_number} &nbsp;&nbsp; <strong>IFSC:</strong> {employee.ifsc_code}</p>
            <p style={{ marginTop: '2mm' }}><strong>Education:</strong> {employee.education_qualification} ({employee.year_of_passing}) - {employee.institute}</p>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            {!isNA(employee.office_sim) && <p><strong>{employee.check_sim === 1 ? '✓ ' : '☐ '}Office SIM:</strong> {employee.office_sim} {!isNA(employee.office_sim_date) && `(${formatDate(employee.office_sim_date)})`}</p>}
            {!isNA(employee.laptop_system) && <p><strong>{employee.check_laptop === 1 ? '✓ ' : '☐ '}Laptop/System:</strong> {employee.laptop_system} {!isNA(employee.laptop_system_date) && `(${formatDate(employee.laptop_system_date)})`}</p>}
            {!isNA(employee.official_email_crm) && <p><strong>Official Email/CRM:</strong> {employee.official_email_crm} {!isNA(employee.official_email_crm_date) && `(${employee.official_email_crm_date})`}</p>}
            {!isNA(employee.asset_official_mail) && <p><strong>{employee.check_official_mail === 1 ? '✓ ' : '☐ '}Official Mail ID:</strong> {employee.asset_official_mail}</p>}
            <p>
              {!isNA(employee.asset_crm) && <span><strong>{employee.check_crm === 1 ? '✓ ' : '☐ '}CRM (Asset):</strong> {employee.asset_crm} &nbsp;&nbsp; </span>} 
              {!isNA(employee.asset_peopledesk) && <span><strong>{employee.check_peopledesk === 1 ? '✓ ' : '☐ '}Peopledesk:</strong> {employee.asset_peopledesk}</span>}
            </p>
            <p>
              {!isNA(employee.asset_projects) && <span><strong>{employee.check_projects === 1 ? '✓ ' : '☐ '}Projects:</strong> {employee.asset_projects} &nbsp;&nbsp; </span>} 
              {!isNA(employee.asset_id_card) && <span><strong>{employee.check_id_card === 1 ? '✓ ' : '☐ '}ID Card:</strong> {employee.asset_id_card}</span>}
            </p>
            {!isNA(employee.asset_offer_letter) && <p><strong>{employee.check_offer_letter === 1 ? '✓ ' : '☐ '}Offer Letter:</strong> {employee.asset_offer_letter}</p>}
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>VI. SUBMITTED DOCUMENTS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2mm' }}>
              {(() => {
                try {
                  const docs = JSON.parse(employee.documents_submitted || '{}');
                  return Object.entries(docs).map(([key, value]) => (
                    <div key={key}>• {key.replace(/_/g, ' ').toUpperCase()}: {value ? 'YES' : 'NO'}</div>
                  ));
                } catch (e) { return <div>No document information available.</div>; }
              })()}
            </div>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>VII. PREVIOUS EMPLOYMENT</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '1mm' }}>Company</th>
                  <th style={{ border: '1px solid #ddd', padding: '1mm' }}>Designation</th>
                  <th style={{ border: '1px solid #ddd', padding: '1mm' }}>Period</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  try {
                    const exp = JSON.parse(employee.previous_employment || '[]');
                    if (!exp.length) return <tr><td colSpan="3" style={{ border: '1px solid #ddd', padding: '1mm', textAlign: 'center' }}>No previous employment recorded.</td></tr>;
                    return exp.map((job, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '1mm' }}>{job.company}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1mm' }}>{job.designation}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1mm' }}>{job.period}</td>
                      </tr>
                    ));
                  } catch (e) { return <tr><td colSpan="4" style={{ textAlign: 'center' }}>Error parsing experience data.</td></tr>; }
                })()}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>VIII. BACKGROUND VERIFICATION</h3>
            {(() => {
              try {
                const bgc = JSON.parse(employee.background_verification || '{}');
                if (!bgc.type) return <p>No background verification details provided.</p>;
                return (
                  <div style={{ fontSize: '9pt' }}>
                    <p><strong>Verification Type:</strong> {bgc.type}</p>
                    {bgc.type === 'FRESHER' && bgc.educational && (
                      <p><strong>Educational Reference:</strong> {bgc.educational.college} (HOD: {bgc.educational.hod}, {bgc.educational.mobile}, {bgc.educational.email})</p>
                    )}
                    {bgc.type === 'EXPERIENCED' && bgc.company && (
                      <div>
                        {bgc.company.manager_name && <p><strong>Reporting Manager:</strong> {bgc.company.manager_name} ({bgc.company.manager_contact}, {bgc.company.manager_email})</p>}
                        {bgc.company.hr_name && <p><strong>HR:</strong> {bgc.company.hr_name} ({bgc.company.hr_contact}, {bgc.company.hr_email})</p>}
                      </div>
                    )}
                    <p><strong>House Type:</strong> {bgc.address?.house_type}</p>
                    {bgc.address?.neighbour_name && <p><strong>Neighbour:</strong> {bgc.address.neighbour_name} ({bgc.address.neighbour_contact})</p>}
                    {bgc.address?.owner_name && <p><strong>Owner:</strong> {bgc.address.owner_name} ({bgc.address.owner_contact})</p>}
                    {bgc.address?.pg_manager && <p><strong>PG Manager:</strong> {bgc.address.pg_manager} ({bgc.address.pg_contact})</p>}
                    <p><strong>Verified Address:</strong> {bgc.address?.current_address}</p>
                    <p style={{marginTop:'2mm'}}><strong>CLOSE FRIEND:</strong> {bgc.friend?.name} ({bgc.friend?.designation}) • {bgc.friend?.contact} • {bgc.friend?.email}</p>
                    <p><strong>RELATIVE:</strong> {bgc.relative?.name} ({bgc.relative?.designation}) • {bgc.relative?.contact}</p>
                    <p style={{ fontSize: '8pt', fontStyle: 'italic', marginTop: '1mm', color: '#555' }}>"Authorized company to contact references for verification purposes."</p>
                  </div>
                );
              } catch (e) { return <p>Data processing error.</p>; }
            })()}
          </div>

          <div style={{ pageBreakBefore: 'always', marginTop: '10mm' }}>
            <h3 style={{ borderBottom: '2px solid black', paddingBottom: '2mm', fontSize: '14pt', margin: '10mm 0 5mm' }}>IX. DECLARATION & CONSENT</h3>
            <div style={{ fontSize: '8pt', textAlign: 'justify', lineHeight: '1.4' }}>
              <p>I, <strong>{employee.full_name}</strong>, residing at <strong>{employee.present_address}</strong>, hereby give my free, voluntary, specific, informed, and unconditional consent to ORBIX DESIGNS PRIVATE LIMITED for the purposes of employment, verification of documents, and data collection/processing.</p>
              
              <p style={{marginTop:'3mm'}}><strong>SCOPE:</strong> I authorize the collection/storage of personal and professional information, maintenance of records, internal sharing on a need-to-know basis, and verification of documents. My data will be treated confidentially with reasonable security measures as per the Information Technology Act, 2000 and Digital Personal Data Protection Act, 2023.</p>
              
              <p style={{marginTop:'3mm'}}><strong>POSH & WHISTLEBLOWER:</strong> I acknowledge that I have received, read, and understood the Prevention of Sexual Harassment (POSH) Policy and the Whistleblower Policy of Orbix Designs Pvt Ltd. I agree to comply with these policies and maintain a respectful workplace.</p>
              
              <p style={{marginTop:'3mm'}}><strong>EMPLOYEE TERMS:</strong> I accept the official Employee Terms & Conditions, including those regarding Appointment, Training, Compensation, Confidentiality, Code of Conduct, and Termination. I understand that salary and benefits are confidential and any breach of data protection will be treated as serious misconduct.</p>
              
              <div style={{ marginTop: '8mm', border: '1px solid black', padding: '4mm' }}>
                <p><strong>FINAL DECLARATION:</strong> I hereby declare that all the information provided in this record is true and correct to the best of my knowledge. I understand that any false information or misrepresentation may lead to disciplinary action, including immediate termination of employment.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10mm' }}>
                   <div style={{ textAlign: 'center' }}>
                     <p style={{ margin: 0, borderBottom: '1px solid black', minWidth: '40mm' }}>{employee.signature_name || employee.full_name}</p>
                     <p style={{ fontSize: '7pt', marginTop: '1mm' }}>Employee Digital Signature</p>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <p>Date: {new Date().toLocaleDateString()}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10mm', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '5mm' }}>
            <p style={{ fontSize: '8pt', color: '#94a3b8' }}>End of Official Employee Record</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
