import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Save, Upload, ArrowLeft, UserCircle } from 'lucide-react';
import API_BASE_URL from '../config';
import logo from '../assets/logo.jpg';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    status: 'Onboard',
    file_no: '', full_name: '', father_mother_name: '', dob: '', gender: '', contact_number: '', blood_group: '', 
    personal_email: '', marital_status: '', present_address: '', permanent_address: '',
    employee_id: '', department: '', designation: '', date_of_joining: '', official_joining_date: '', work_location: '', reporting_manager: '',
    pan_number: '', aadhaar_number: '', other_id: '',
    emergency_contact_name: '', emergency_contact_relationship: '', emergency_contact_number: '', 
    father_husband_number: '', mother_wife_number: '', alternate_number: '',
    father_name: '', mother_name: '', father_mobile: '', mother_mobile: '', wedding_date: '',
    account_holder_name: '', account_number: '', bank_name: '', ifsc_code: '', branch: '',
    education_qualification: '', year_of_passing: '', institute: '',
    official_email_crm: '', official_email_crm_date: '',
    asset_crm: '', asset_peopledesk: '', asset_projects: '', asset_id_card: '', asset_official_mail: '', asset_offer_letter: '',
    check_sim: 0, check_laptop: 0, check_crm: 0, check_peopledesk: 0, check_projects: 0, check_id_card: 0, check_official_mail: 0, check_offer_letter: 0,
    bank_passbook_path: '', bank_passbook_back_path: '',
    pan_card_path: '', pan_card_back_path: '',
    aadhaar_card_path: '', aadhaar_card_back_path: '',
    educational_certificate_path: '', educational_certificate_back_path: '',
    resume_path: '',
    signature_name: '',
    documents_submitted: JSON.stringify({}),
    previous_employment: JSON.stringify([]),
    background_verification: JSON.stringify({ type: '', address: { house_type: '' } }),
    documents_passwords: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [docs, setDocs] = useState({
    bank_passbook: null,
    bank_passbook_back: null,
    pan_card: null,
    pan_card_back: null,
    aadhaar_card: null,
    aadhaar_card_back: null,
    educational_certificate: null,
    educational_certificate_back: null,
    resume: null
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/employees/${id}`);
        setFormData(res.data);
        if (res.data.photo_path) {
          setPhotoPreview(`${API_BASE_URL}${res.data.photo_path}`);
        }
      } catch (err) {
        console.error(err);
        alert('Error fetching employee data');
      }
      setLoading(false);
    };
    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Numeric only validation
    const numericFields = [
      'contact_number', 'emergency_contact_number', 'father_husband_number', 
      'mother_wife_number', 'alternate_number', 'account_number', 'aadhaar_number',
      'father_mobile', 'mother_mobile'
    ];
    if (numericFields.includes(name)) {
      if (value !== '' && !/^\d+$/.test(value)) return;
      if (name === 'aadhaar_number' && value.length > 12) return;
    }

    // PAN Card length limit
    if (name === 'pan_number' && value.length > 10) return;

    const isEmailField = name === 'personal_email' || name === 'official_email_crm';
    setFormData(prev => ({ ...prev, [name]: isEmailField ? value : value.toUpperCase() }));
  };

  const handleFileChange = (e, name) => {
    const file = e.target.files[0];
    if (file) {
      setDocs(prev => ({ ...prev, [name]: file }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateStep = () => {
    const stepRef = document.querySelector('form');
    if (!stepRef) return true;
    
    const requiredInputs = stepRef.querySelectorAll('[required]');
    let isValid = true;
    
    requiredInputs.forEach(input => {
      if (!input.value || input.value.trim() === '') {
        input.classList.add('invalid-field');
        isValid = false;
      } else {
        input.classList.remove('invalid-field');
      }
    });

    if (!isValid) {
      alert("Please fill all mandatory fields marked with * before continuing.");
    }

    // Step 5 Mandatory Documents Check
    if (step === 5 && isValid) {
      const requiredDocs = [
        { name: 'bank_passbook', label: 'Bank Passbook (Front)', path: formData.bank_passbook_path },
        { name: 'pan_card', label: 'PAN Card (Front)', path: formData.pan_card_path },
        { name: 'aadhaar_card', label: 'Aadhaar Card (Front)', path: formData.aadhaar_card_path },
        { name: 'educational_certificate', label: 'Educational Certificate (Front)', path: formData.educational_certificate_path },
        { name: 'resume', label: 'Resume/CV', path: formData.resume_path }
      ];
      
      const missingDocs = requiredDocs.filter(doc => !docs[doc.name] && !doc.path);
      if (missingDocs.length > 0) {
        alert("Please upload the following mandatory documents:\n" + missingDocs.map(d => "- " + d.label).join("\n"));
        return false;
      }
    }

    return isValid;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const addEmployment = () => {
    const current = JSON.parse(formData.previous_employment || '[]');
    setFormData(prev => ({
      ...prev,
      previous_employment: JSON.stringify([...current, { company: '', crm: '', designation: '', period: '' }])
    }));
  };

  const updateEmployment = (index, field, value) => {
    const current = JSON.parse(formData.previous_employment || '[]');
    current[index][field] = value.toUpperCase();
    setFormData(prev => ({ ...prev, previous_employment: JSON.stringify(current) }));
  };

  const updateBGC = (path, value) => {
    // Numeric validation for contact fields in BGC
    if (path.endsWith('mobile') || path.endsWith('contact')) {
        if (value !== '' && !/^\d+$/.test(value)) return;
    }

    const bgc = JSON.parse(formData.background_verification || '{}');
    const parts = path.split('.');
    let current = bgc;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value.toUpperCase();
    setFormData(prev => ({ ...prev, background_verification: JSON.stringify(bgc) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (formData.aadhaar_number && formData.aadhaar_number.toString().length !== 12) {
      alert("Aadhaar Number must be exactly 12 digits");
      return;
    }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.pan_number && !panRegex.test(formData.pan_number)) {
      alert("Invalid PAN Format (Sample: ASASA4569A)");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
        // Handle potentially missing values or nested objects
        data.append(key, formData[key] || '');
    });
    if (photo) data.append('photo', photo);
    Object.keys(docs).forEach(key => {
      if (docs[key]) data.append(key, docs[key]);
    });

    try {
      await axios.put(`${API_BASE_URL}/api/employees/${id}`, data);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Error updating employee');
    }
  };

  if (loading) return <div className="loading">Loading employee data...</div>;

  if (isSubmitted) {
    return (
      <div className="card slide-in" style={{ textAlign: 'center', padding: '5rem 2rem', maxWidth: '600px', margin: '4rem auto' }}>
        {logo && <img src={logo} alt="Orbix" style={{ height: '60px', width: 'auto', marginBottom: '3rem' }} />}
        
        <div className="success-animation" style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            background: '#22c55e', 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
            animation: 'scaleUp 0.5s ease-out forwards'
          }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 0.5s 0.3s ease-in-out both' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Updated Successfully!
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
          The employee record for <strong>{formData.full_name}</strong> has been successfully updated.
        </p>
        
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate(`/employee/${id}`)} className="btn btn-primary">
              View Profile
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>

        <style>{`
          @keyframes scaleUp {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes drawCheck {
            0% { stroke-dasharray: 50; stroke-dashoffset: 50; }
            100% { stroke-dasharray: 50; stroke-dashoffset: 0; }
          }
          .success-animation {
            perspective: 1000px;
          }
        `}</style>
      </div>
    );
  }

  const renderStep = () => {
    switch(step) {
      case 1: return (
        <div>
          <h3 className="section-title">1. PERSONAL INFORMATION</h3>
          <div className="form-grid">
            <div className="form-group"><label>FILE NO.</label><input name="file_no" value={formData.file_no} onChange={handleChange} /></div>
            <div className="form-group"><label>FULL NAME <span style={{color:'#ef4444'}}>*</span></label><input name="full_name" value={formData.full_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>FATHER'S NAME <span style={{color:'#ef4444'}}>*</span></label><input name="father_name" value={formData.father_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>MOTHER'S NAME <span style={{color:'#ef4444'}}>*</span></label><input name="mother_name" value={formData.mother_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>DATE OF BIRTH <span style={{color:'#ef4444'}}>*</span></label><input type="date" name="dob" value={formData.dob} onChange={handleChange} required /></div>
            <div className="form-group"><label>WEDDING DATE (OPTIONAL)</label><input type="date" name="wedding_date" value={formData.wedding_date} onChange={handleChange} /></div>
            <div className="form-group"><label>GENDER <span style={{color:'#ef4444'}}>*</span></label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="form-group"><label>CONTACT NUMBER (+91) <span style={{color:'#ef4444'}}>*</span></label><input name="contact_number" value={formData.contact_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>BLOOD GROUP <span style={{color:'#ef4444'}}>*</span></label><input name="blood_group" value={formData.blood_group} onChange={handleChange} required /></div>
            <div className="form-group"><label>PERSONAL EMAIL ID <span style={{color:'#ef4444'}}>*</span></label><input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} style={{textTransform:'none'}} required /></div>
            <div className="form-group"><label>MARITAL STATUS <span style={{color:'#ef4444'}}>*</span></label>
               <select name="marital_status" value={formData.marital_status} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="SINGLE">SINGLE</option>
                <option value="MARRIED">MARRIED</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{marginTop:'1.5rem'}}><label>PRESENT ADDRESS <span style={{color:'#ef4444'}}>*</span></label><textarea name="present_address" value={formData.present_address} onChange={handleChange} required></textarea></div>
          <div className="form-group" style={{marginTop:'1.5rem'}}><label>PERMANENT ADDRESS <span style={{color:'#ef4444'}}>*</span></label><textarea name="permanent_address" value={formData.permanent_address} onChange={handleChange} required></textarea></div>
          <div className="form-group" style={{marginTop:'1.5rem'}}>
            <label>PHOTO (PASSPORT SIZE)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '140px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  {photoPreview ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (formData.photo_path ? <img src={`${API_BASE_URL}${formData.photo_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#444'}}><UserCircle size={48} /></div>)}
                </div>
                <div style={{flex:1}}>
                  <p style={{background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
                    <strong>Reminder:</strong> Please upload a <strong>neat and clear</strong> professional photo.
                  </p>
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <Upload size={16} /> Change Photo
                    <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
                  </label>
                </div>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div>
          <h3 className="section-title">2. EMPLOYMENT DETAILS</h3>
          <div className="form-grid">
            <div className="form-group"><label>EMPLOYEE STATUS</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="New">NEW</option>
                <option value="Trainee">TRAINEE</option>
                <option value="Onboard">ONBOARD</option>
                <option value="Current Employee">CURRENT EMPLOYEE</option>
                <option value="Bix Employee">BIX EMPLOYEE</option>
                <option value="Bench">BENCH (NOTICE PERIOD)</option>
                <option value="Resigned">RESIGNED</option>
              </select>
            </div>
            <div className="form-group"><label>EMPLOYEE ID (OPTIONAL)</label><input name="employee_id" value={formData.employee_id} onChange={handleChange} /></div>
            <div className="form-group"><label>DEPARTMENT</label><input name="department" value={formData.department} onChange={handleChange} /></div>
            <div className="form-group"><label>DESIGNATION</label><input name="designation" value={formData.designation} onChange={handleChange} /></div>
            <div className="form-group"><label>DATE OF JOINING <span style={{color:'#ef4444'}}>*</span></label><input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} required /></div>
            <div className="form-group"><label>OFFICIAL JOINING DATE</label><input type="date" name="official_joining_date" value={formData.official_joining_date || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>WORK LOCATION / BRANCH <span style={{color:'#ef4444'}}>*</span></label>
              <select 
                name="work_location" 
                value={['MTRS', 'PORUR', 'OMR', ''].includes(formData.work_location) ? formData.work_location : 'OTHER'} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, work_location: val }));
                }} 
                required
              >
                <option value="">Select Location</option>
                <option value="MTRS">MTRS</option>
                <option value="PORUR">PORUR</option>
                <option value="OMR">OMR</option>
                <option value="OTHER">OTHER (PLEASE TYPE BELOW)</option>
              </select>
              {(!['MTRS', 'PORUR', 'OMR', ''].includes(formData.work_location) || formData.work_location === 'OTHER') && (
                <input 
                  name="work_location_custom" 
                  placeholder="Enter custom location" 
                  style={{marginTop:'0.5rem'}}
                  value={formData.work_location === 'OTHER' ? '' : formData.work_location}
                  onChange={(e) => setFormData(p => ({...p, work_location: e.target.value.toUpperCase()}))} 
                />
              )}
            </div>
            <div className="form-group"><label>REPORTING MANAGER (OPTIONAL)</label><input name="reporting_manager" value={formData.reporting_manager} onChange={handleChange} /></div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <h3 className="section-title">3. IDENTIFICATION & EMERGENCY</h3>
          <div className="form-grid">
            <div className="form-group"><label>PAN NUMBER <span style={{color:'#ef4444'}}>*</span></label><input name="pan_number" value={formData.pan_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>AADHAAR NUMBER <span style={{color:'#ef4444'}}>*</span></label><input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>OTHER ID (OPTIONAL)</label><input name="other_id" value={formData.other_id} onChange={handleChange} /></div>
          </div>
          <h4 style={{margin:'2rem 0 1rem', fontSize:'0.9rem'}}>EMERGENCY CONTACT</h4>
          <div className="form-grid">
            <div className="form-group"><label>NAME <span style={{color:'#ef4444'}}>*</span></label><input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>RELATIONSHIP <span style={{color:'#ef4444'}}>*</span></label><input name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleChange} required /></div>
            <div className="form-group"><label>CONTACT NUMBER <span style={{color:'#ef4444'}}>*</span></label><input name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>FATHER MOBILE NUMBER <span style={{color:'#ef4444'}}>*</span></label><input name="father_mobile" value={formData.father_mobile} onChange={handleChange} required /></div>
            <div className="form-group"><label>MOTHER MOBILE NUMBER <span style={{color:'#ef4444'}}>*</span></label><input name="mother_mobile" value={formData.mother_mobile} onChange={handleChange} required /></div>
            <div className="form-group"><label>ALTERNATE NUMBER <span style={{color:'#ef4444'}}>*</span></label><input name="alternate_number" value={formData.alternate_number} onChange={handleChange} required /></div>
          </div>
        </div>
      );
      case 4: return (
        <div>
           <h3 className="section-title">4. BANK & EDUCATION</h3>
           <div className="form-grid">
            <div className="form-group"><label>ACCOUNT HOLDER NAME <span style={{color:'#ef4444'}}>*</span></label><input name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>ACCOUNT NO. <span style={{color:'#ef4444'}}>*</span></label><input name="account_number" value={formData.account_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>BANK NAME <span style={{color:'#ef4444'}}>*</span></label><input name="bank_name" value={formData.bank_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>IFSC CODE <span style={{color:'#ef4444'}}>*</span></label><input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} required /></div>
            <div className="form-group"><label>BRANCH <span style={{color:'#ef4444'}}>*</span></label><input name="branch" value={formData.branch} onChange={handleChange} required /></div>
          </div>
          <h4 style={{margin:'2rem 0 1rem', fontSize:'0.9rem'}}>EDUCATION</h4>
          <div className="form-grid">
            <div className="form-group"><label>QUALIFICATION <span style={{color:'#ef4444'}}>*</span></label><input name="education_qualification" value={formData.education_qualification} onChange={handleChange} required /></div>
            <div className="form-group"><label>YEAR OF PASSING <span style={{color:'#ef4444'}}>*</span></label><input name="year_of_passing" value={formData.year_of_passing} onChange={handleChange} required /></div>
            <div className="form-group"><label>INSTITUTE <span style={{color:'#ef4444'}}>*</span></label><input name="institute" value={formData.institute || ''} onChange={handleChange} required /></div>
          </div>
          <h3 className="section-title">5. OFFICE ASSETS & SYSTEMS (OPTIONAL)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_sim === 1} onChange={(e) => setFormData(p => ({...p, check_sim: e.target.checked ? 1 : 0}))} />
                OFFICE SIM (OPTIONAL)
              </label>
              <input name="office_sim" value={formData.office_sim || ''} onChange={handleChange} />
            </div>
            <div className="form-group"><label>SIM ALLOCATED DATE (OPTIONAL)</label><input type="date" name="office_sim_date" value={formData.office_sim_date || ''} onChange={handleChange} /></div>
            
            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_laptop === 1} onChange={(e) => setFormData(p => ({...p, check_laptop: e.target.checked ? 1 : 0}))} />
                LAPTOP/SYSTEM (OPTIONAL)
              </label>
              <input name="laptop_system" value={formData.laptop_system || ''} onChange={handleChange} />
            </div>
            <div className="form-group"><label>LAPTOP ALLOCATED DATE (OPTIONAL)</label><input type="date" name="laptop_system_date" value={formData.laptop_system_date || ''} onChange={handleChange} /></div>
            
            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_official_mail === 1} onChange={(e) => setFormData(p => ({...p, check_official_mail: e.target.checked ? 1 : 0}))} />
                OFFICIAL MAIL ID
              </label>
              <input name="asset_official_mail" value={formData.asset_official_mail || ''} onChange={handleChange} style={{textTransform:'none'}} />
            </div>

            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_crm === 1} onChange={(e) => setFormData(p => ({...p, check_crm: e.target.checked ? 1 : 0}))} />
                CRM (ASSET)
              </label>
              <input name="asset_crm" value={formData.asset_crm || ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_peopledesk === 1} onChange={(e) => setFormData(p => ({...p, check_peopledesk: e.target.checked ? 1 : 0}))} />
                PEOPLEDESK
              </label>
              <input name="asset_peopledesk" value={formData.asset_peopledesk || ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_projects === 1} onChange={(e) => setFormData(p => ({...p, check_projects: e.target.checked ? 1 : 0}))} />
                PROJECTS
              </label>
              <input name="asset_projects" value={formData.asset_projects || ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_id_card === 1} onChange={(e) => setFormData(p => ({...p, check_id_card: e.target.checked ? 1 : 0}))} />
                ID CARD
              </label>
              <input name="asset_id_card" value={formData.asset_id_card || ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <input type="checkbox" checked={formData.check_offer_letter === 1} onChange={(e) => setFormData(p => ({...p, check_offer_letter: e.target.checked ? 1 : 0}))} />
                OFFER LETTER
              </label>
              <input name="asset_offer_letter" value={formData.asset_offer_letter || ''} onChange={handleChange} />
            </div>
          </div>
        </div>
      );
      case 6: {
        const bgc = JSON.parse(formData.background_verification || '{}');
        return (
          <div>
            <h3 className="section-title">9. BACKGROUND VERIFICATION</h3>
            <div className="form-group" style={{marginBottom:'2rem'}}>
              <label>ARE YOU A FRESHER OR EXPERIENCED?</label>
              <select 
                value={bgc.type || ''} 
                onChange={(e) => updateBGC('type', e.target.value)}
                required
              >
                <option value="">Select Type</option>
                <option value="FRESHER">FRESHER</option>
                <option value="EXPERIENCED">EXPERIENCED</option>
              </select>
            </div>

            {bgc.type === 'FRESHER' && (
              <div className="bgc-section slide-in" style={{marginBottom:'2rem', padding:'1.5rem', background:'rgba(59, 130, 246, 0.05)', borderRadius:'12px', border:'1px solid rgba(59, 130, 246, 0.1)'}}>
                <h4 style={{fontSize:'0.8rem', color:'#60a5fa', marginBottom:'1rem'}}>I. EDUCATIONAL VERIFICATION (FRESHER)</h4>
                <div className="form-grid">
                  <div className="form-group"><label>COLLEGE NAME</label><input value={bgc.educational?.college || ''} onChange={(e) => updateBGC('educational.college', e.target.value)} required /></div>
                  <div className="form-group"><label>HOD / LECTURER NAME</label><input value={bgc.educational?.hod || ''} onChange={(e) => updateBGC('educational.hod', e.target.value)} required /></div>
                  <div className="form-group"><label>HOD / LECTURER MOBILE NO.</label><input value={bgc.educational?.mobile || ''} onChange={(e) => updateBGC('educational.mobile', e.target.value)} required /></div>
                  <div className="form-group"><label>HOD / LECTURER EMAIL ID</label><input type="email" style={{textTransform:'none'}} value={bgc.educational?.email || ''} onChange={(e) => updateBGC('educational.email', e.target.value)} required /></div>
                </div>
              </div>
            )}

            {bgc.type === 'EXPERIENCED' && (
              <div className="bgc-section slide-in" style={{marginBottom:'2rem', padding:'1.5rem', background:'rgba(59, 130, 246, 0.05)', borderRadius:'12px', border:'1px solid rgba(59, 130, 246, 0.1)'}}>
                <h4 style={{fontSize:'0.8rem', color:'#60a5fa', marginBottom:'1rem'}}>I. PREVIOUS COMPANY VERIFICATION (EXPERIENCED)</h4>
                <div className="form-grid">
                  <div className="form-group"><label>REPORTING MANAGER NAME</label><input value={bgc.company?.manager_name || ''} onChange={(e) => updateBGC('company.manager_name', e.target.value)} /></div>
                  <div className="form-group"><label>MANAGER CONTACT NO.</label><input value={bgc.company?.manager_contact || ''} onChange={(e) => updateBGC('company.manager_contact', e.target.value)} /></div>
                  <div className="form-group"><label>MANAGER EMAIL ID</label><input type="email" style={{textTransform:'none'}} value={bgc.company?.manager_email || ''} onChange={(e) => updateBGC('company.manager_email', e.target.value)} /></div>
                  <div className="form-group"><label>HR NAME</label><input value={bgc.company?.hr_name || ''} onChange={(e) => updateBGC('company.hr_name', e.target.value)} /></div>
                  <div className="form-group"><label>HR CONTACT NO.</label><input value={bgc.company?.hr_contact || ''} onChange={(e) => updateBGC('company.hr_contact', e.target.value)} /></div>
                  <div className="form-group"><label>HR EMAIL ID</label><input type="email" style={{textTransform:'none'}} value={bgc.company?.hr_email || ''} onChange={(e) => updateBGC('company.hr_email', e.target.value)} /></div>
                </div>
              </div>
            )}

            {bgc.type && (
              <div className="slide-in">
                <div className="bgc-section" style={{marginBottom:'2rem', padding:'1.5rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--glass-border)'}}>
                  <h4 style={{fontSize:'0.8rem', color:'#60a5fa', marginBottom:'1rem'}}>II. ADDRESS VERIFICATION</h4>
                  <div className="form-group" style={{marginBottom:'1rem'}}>
                    <label>HOUSE TYPE</label>
                    <select value={bgc.address?.house_type || ''} onChange={(e) => updateBGC('address.house_type', e.target.value)} required>
                      <option value="">Select</option>
                      <option value="OWN">OWN</option>
                      <option value="RENT">RENT</option>
                      <option value="PG">PG</option>
                    </select>
                  </div>
                  {bgc.address?.house_type === 'OWN' && (
                    <div className="form-grid">
                      <div className="form-group"><label>NEIGHBOUR NAME</label><input value={bgc.address?.neighbour_name || ''} onChange={(e) => updateBGC('address.neighbour_name', e.target.value)} required /></div>
                      <div className="form-group"><label>NEIGHBOUR CONTACT NO.</label><input value={bgc.address?.neighbour_contact || ''} onChange={(e) => updateBGC('address.neighbour_contact', e.target.value)} required /></div>
                    </div>
                  )}
                  {bgc.address?.house_type === 'RENT' && (
                    <div className="form-grid">
                      <div className="form-group"><label>HOUSE OWNER NAME</label><input value={bgc.address?.owner_name || ''} onChange={(e) => updateBGC('address.owner_name', e.target.value)} required /></div>
                      <div className="form-group"><label>OWNER CONTACT NO.</label><input value={bgc.address?.owner_contact || ''} onChange={(e) => updateBGC('address.owner_contact', e.target.value)} required /></div>
                    </div>
                  )}
                  {bgc.address?.house_type === 'PG' && (
                    <div className="form-grid">
                      <div className="form-group"><label>PG OWNER/MANAGER NAME</label><input value={bgc.address?.pg_manager || ''} onChange={(e) => updateBGC('address.pg_manager', e.target.value)} required /></div>
                      <div className="form-group"><label>CONTACT NO.</label><input value={bgc.address?.pg_contact || ''} onChange={(e) => updateBGC('address.pg_contact', e.target.value)} required /></div>
                    </div>
                  )}
                  <div className="form-group" style={{marginTop:'1rem'}}><label>CURRENT ADDRESS (ONCE MORE)</label><textarea value={bgc.address?.current_address || ''} onChange={(e) => updateBGC('address.current_address', e.target.value)} required></textarea></div>
                </div>

                <div className="bgc-section" style={{marginBottom:'2rem', padding:'1.5rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--glass-border)'}}>
                  <h4 style={{fontSize:'0.8rem', color:'#60a5fa', marginBottom:'1rem'}}>III. CLOSE FRIEND VERIFICATION</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>CLOSE FRIEND NAME</label><input value={bgc.friend?.name || ''} onChange={(e) => updateBGC('friend.name', e.target.value)} required /></div>
                    <div className="form-group"><label>DESIGNATION</label><input value={bgc.friend?.designation || ''} onChange={(e) => updateBGC('friend.designation', e.target.value)} required /></div>
                    <div className="form-group"><label>CONTACT NO.</label><input value={bgc.friend?.contact || ''} onChange={(e) => updateBGC('friend.contact', e.target.value)} required /></div>
                    <div className="form-group"><label>EMAIL ID</label><input type="email" style={{textTransform:'none'}} value={bgc.friend?.email || ''} onChange={(e) => updateBGC('friend.email', e.target.value)} required /></div>
                  </div>
                </div>

                <div className="bgc-section" style={{marginBottom:'2rem', padding:'1.5rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--glass-border)'}}>
                  <h4 style={{fontSize:'0.8rem', color:'#60a5fa', marginBottom:'1rem'}}>IV. NON-FAMILY MEMBER (RELATIVE) VERIFICATION</h4>
                  <div className="form-grid">
                    <div className="form-group"><label>RELATIVE NAME <span style={{color:'#ef4444'}}>*</span></label><input value={bgc.relative?.name || ''} onChange={(e) => updateBGC('relative.name', e.target.value)} required /></div>
                    <div className="form-group"><label>DESIGNATION <span style={{color:'#ef4444'}}>*</span></label><input value={bgc.relative?.designation || ''} onChange={(e) => updateBGC('relative.designation', e.target.value)} required /></div>
                    <div className="form-group"><label>CONTACT NO. <span style={{color:'#ef4444'}}>*</span></label><input value={bgc.relative?.contact || ''} onChange={(e) => updateBGC('relative.contact', e.target.value)} required /></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 5: return (
        <div>
          <h3 className="section-title">6. PREVIOUS EMPLOYMENT</h3>
          {JSON.parse(formData.previous_employment || '[]').map((job, idx) => (
            <div key={idx} style={{marginBottom:'1.5rem', padding:'1.5rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--glass-border)'}}>
              <div className="form-grid">
                <div className="form-group"><label>COMPANY</label><input value={job.company} onChange={(e) => updateEmployment(idx, 'company', e.target.value)} /></div>
                <div className="form-group"><label>DESIGNATION</label><input value={job.designation} onChange={(e) => updateEmployment(idx, 'designation', e.target.value)} /></div>
                <div className="form-group"><label>PERIOD</label><input value={job.period} onChange={(e) => updateEmployment(idx, 'period', e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addEmployment} className="btn btn-secondary" style={{width:'100%', border:'1px dashed var(--glass-border)'}}>+ Add Employment History</button>
          
          <h3 className="section-title" style={{marginTop:'3rem'}}>7. SUPPORTING DOCUMENTS (UPLOAD)</h3>
          <p style={{background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
            <strong>Admin Note:</strong> Ensure all updated documents are <strong>neat and clear</strong> (PDFs or Images).
          </p>
          <div className="form-grid">
            {[
              { label: 'BANK PASSBOOK (FRONT)', name: 'bank_passbook', path: formData.bank_passbook_path, required: true },
              { label: 'BANK PASSBOOK (BACK)', name: 'bank_passbook_back', path: formData.bank_passbook_back_path, required: false },
              { label: 'PAN CARD (FRONT)', name: 'pan_card', path: formData.pan_card_path, required: true },
              { label: 'PAN CARD (BACK)', name: 'pan_card_back', path: formData.pan_card_back_path, required: false },
              { label: 'AADHAAR CARD (FRONT)', name: 'aadhaar_card', path: formData.aadhaar_card_path, required: true },
              { label: 'AADHAAR CARD (BACK)', name: 'aadhaar_card_back', path: formData.aadhaar_card_back_path, required: false },
              { label: 'EDUCATIONAL CERTIFICATE (FRONT)', name: 'educational_certificate', path: formData.educational_certificate_path, required: true },
              { label: 'EDUCATIONAL CERTIFICATE (BACK)', name: 'educational_certificate_back', path: formData.educational_certificate_back_path, required: false },
              { label: 'RESUME / CV', name: 'resume', path: formData.resume_path, required: true }
            ].map(doc => (
              <div className="form-group" key={doc.name}>
                <label>{doc.label} {doc.required ? <span style={{color:'#ef4444'}}>*</span> : <span style={{color:'var(--text-dim)', fontSize:'0.7rem'}}>(OPTIONAL)</span>}</label>
                <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                  <input type="file" onChange={(e) => handleFileChange(e, doc.name)} accept="image/*,.pdf" style={{fontSize:'0.7rem'}} required={doc.required && !doc.path} />
                  {doc.path && !docs[doc.name] && <a href={`${API_BASE_URL}${doc.path}`} target="_blank" rel="noreferrer" style={{fontSize:'0.7rem', color:'#60a5fa'}}>View Existing</a>}
                </div>
                {docs[doc.name] && <p style={{fontSize:'0.7rem', color:'#22c55e'}}>Selected: {docs[doc.name].name}</p>}
              </div>
            ))}
          </div>

          <div className="form-group" style={{marginTop:'1.5rem'}}>
            <label>PASSWORDS (IF ANY DOCS ARE ENCRYPTED)</label>
            <input 
              name="documents_passwords" 
              value={formData.documents_passwords || ''} 
              onChange={handleChange} 
              placeholder="e.g. Aadhaar: 1234"
              style={{textTransform:'none'}}
            />
          </div>
          
          <h3 className="section-title" style={{marginTop:'3rem'}}>8. DIGITAL SIGNATURE</h3>
          <div className="form-group">
            <label>SIGNATURE NAME <span style={{color:'#ef4444'}}>*</span></label>
            <input name="signature_name" value={formData.signature_name || ''} onChange={handleChange} required />
          </div>
        </div>
      );
      default: return null;
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'5rem'}}>Loading employee records...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem', border: 'none', background: 'transparent' }}>
        <ArrowLeft size={18} /> Back
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {logo && <img src={logo} alt="Orbix" style={{ height: '40px', width: 'auto' }} />}
            Edit Profile: {formData.full_name}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Updating employee ID #{formData.id}</p>
        </div>
        <div className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          Step {step} of 6
        </div>
      </div>

      <div className="card slide-in">
        <form onSubmit={handleSubmit}>
          {renderStep()}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                <ChevronLeft size={18} /> Previous
              </button>
            ) : <div />}
            
            {step < 6 ? (
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none' }}>
                <Save size={18} /> Save Changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
