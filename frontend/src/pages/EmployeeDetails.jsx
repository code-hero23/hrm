import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, Download, ArrowLeft, Trash2, CheckCircle, UserCircle, Edit3, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_BASE_URL from '../config';

const StatusDropdown = ({ currentStatus, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const statuses = [
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

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Employee_Report_${employee.full_name}.pdf`);
  };

  if (loading) return <div style={{textAlign:'center', padding:'4rem'}}>Loading record...</div>;
  if (!employee) return <div style={{textAlign:'center', padding:'4rem'}}>Employee not found.</div>;

  return (
    <div className="slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ border: 'none', background: 'transparent' }}>
          <ArrowLeft size={20} /> <span style={{fontWeight: 700}}>Back to Workforce</span>
        </button>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
            
            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
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
                <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>{employee.date_of_joining || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section-title">Identity & Contacts</div>
        <div className="form-grid">
          <div className="form-group"><label>Date of Birth</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.dob || '—'}</p></div>
          <div className="form-group"><label>Gender</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.gender || '—'}</p></div>
          <div className="form-group"><label>Contact</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.contact_number || '—'}</p></div>
          <div className="form-group"><label>Email</label><p style={{fontSize: '1.1rem', fontWeight: 500, textTransform: 'none', color: '#60a5fa'}}>{employee.personal_email || '—'}</p></div>
          <div className="form-group"><label>PAN</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.pan_number || '—'}</p></div>
          <div className="form-group"><label>Aadhaar</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.aadhaar_number || '—'}</p></div>
        </div>

        <div className="section-title">Bank Information</div>
        <div className="form-grid">
          <div className="form-group"><label>A/C Holder</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.account_holder_name || '—'}</p></div>
          <div className="form-group"><label>A/C Number</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.account_number || '—'}</p></div>
          <div className="form-group"><label>IFSC Code</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.ifsc_code || '—'}</p></div>
          <div className="form-group"><label>Bank & Branch</label><p style={{fontSize: '1rem', fontWeight: 500}}>{employee.bank_name ? `${employee.bank_name} - ${employee.branch}` : '—'}</p></div>
        </div>
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
              <p><strong>Father/Mother Name:</strong> {employee.father_mother_name}</p>
              <p><strong>DOB:</strong> {employee.dob} &nbsp;&nbsp; <strong>Gender:</strong> {employee.gender}</p>
              <p><strong>Blood Group:</strong> {employee.blood_group} &nbsp;&nbsp; <strong>Marital Status:</strong> {employee.marital_status}</p>
              <p><strong>Contact No:</strong> {employee.contact_number}</p>
              <p><strong>Personal Email:</strong> {employee.personal_email}</p>
              <p><strong>Present Address:</strong> {employee.present_address}</p>
              <p><strong>Permanent Address:</strong> {employee.permanent_address}</p>
            </div>
            <div style={{ width: '40mm', textAlign: 'right' }}>
               {employee.photo_path ? (
                 <img src={`${API_BASE_URL}${employee.photo_path}`} style={{ width: '35mm', height: '45mm', border: '1px solid black', objectFit: 'cover' }} />
               ) : (
                 <div style={{ width: '35mm', height: '45mm', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8pt' }}>NO PHOTO</div>
               )}
            </div>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>II. EMPLOYMENT DETAILS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '1mm 0', width: '33%' }}><strong>Employee ID:</strong> {employee.employee_id}</td>
                  <td style={{ padding: '1mm 0', width: '33%' }}><strong>File No:</strong> {employee.file_no}</td>
                  <td style={{ padding: '1mm 0', width: '33%' }}><strong>Status:</strong> {employee.status}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1mm 0' }}><strong>Department:</strong> {employee.department}</td>
                  <td style={{ padding: '1mm 0' }}><strong>Designation:</strong> {employee.designation}</td>
                  <td style={{ padding: '1mm 0' }}><strong>Date of Joining:</strong> {employee.date_of_joining}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1mm 0' }}><strong>Work Location:</strong> {employee.work_location}</td>
                  <td style={{ padding: '1mm 0' }} colSpan="2"><strong>Reporting Manager:</strong> {employee.reporting_manager}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>III. IDENTIFICATION & EMERGENCY CONTACT</h3>
            <p><strong>PAN Number:</strong> {employee.pan_number} &nbsp;&nbsp; <strong>Aadhaar Number:</strong> {employee.aadhaar_number} &nbsp;&nbsp; <strong>Other ID:</strong> {employee.other_id}</p>
            <div style={{ marginTop: '2mm', background: '#f9f9f9', padding: '2mm', border: '1px solid #eee' }}>
              <p><strong>Emergency Contact:</strong> {employee.emergency_contact_name} ({employee.emergency_contact_relationship}) - {employee.emergency_contact_number}</p>
              <p><strong>Father/Husband No:</strong> {employee.father_husband_number} &nbsp;&nbsp; <strong>Mother/Wife No:</strong> {employee.mother_wife_number} &nbsp;&nbsp; <strong>Alt No:</strong> {employee.alternate_number}</p>
            </div>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>IV. BANK & EDUCATION</h3>
            <p><strong>Bank Name:</strong> {employee.bank_name} &nbsp;&nbsp; <strong>Branch:</strong> {employee.branch}</p>
            <p><strong>A/C Holder:</strong> {employee.account_holder_name} &nbsp;&nbsp; <strong>A/C No:</strong> {employee.account_number} &nbsp;&nbsp; <strong>IFSC:</strong> {employee.ifsc_code}</p>
            <p style={{ marginTop: '2mm' }}><strong>Education:</strong> {employee.education_qualification} ({employee.year_of_passing}) - {employee.institute}</p>
          </div>

          <div style={{ marginBottom: '6mm' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '1mm', fontSize: '12pt' }}>V. OFFICE ASSETS & SYSTEMS</h3>
            <p><strong>Office SIM:</strong> {employee.office_sim || 'N/A'} ({employee.office_sim_date || '—'})</p>
            <p><strong>Laptop/System:</strong> {employee.laptop_system || 'N/A'} ({employee.laptop_system_date || '—'})</p>
            <p><strong>Official Email/CRM:</strong> {employee.official_email_crm || 'N/A'} ({employee.official_email_crm_date || '—'})</p>
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
                  } catch (e) { return <tr><td colSpan="3" style={{ textAlign: 'center' }}>Error parsing experience data.</td></tr>; }
                })()}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '10mm', borderTop: '1px solid black', paddingTop: '5mm' }}>
             <p style={{ fontSize: '9pt', fontStyle: 'italic' }}>I hereby declare that all the information provided above is true and correct to the best of my knowledge.</p>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10mm' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0 }}>__________________________</p>
                  <p style={{ fontSize: '9pt' }}>Employee Signature</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0 }}>__________________________</p>
                  <p style={{ fontSize: '9pt' }}>Authorized Signatory</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Place:</strong> ________________</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
