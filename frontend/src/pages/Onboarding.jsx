import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Save, Upload } from 'lucide-react';
import API_BASE_URL from '../config';
import logo from '../assets/logo.jpg';

const Onboarding = ({ isPublic }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    status: 'Trainee', // Changed default status to Trainee
    file_no: '', full_name: '', father_mother_name: '', dob: '', gender: '', contact_number: '', blood_group: '',
    personal_email: '', marital_status: '', present_address: '', permanent_address: '',
    employee_id: '', department: '', designation: '', date_of_joining: '', official_joining_date: '', work_location: 'PORUR', reporting_manager: '', // Set default work_location to PORUR
    pan_number: '', aadhaar_number: '', other_id: '',
    emergency_contact_name: '', emergency_contact_relationship: '', emergency_contact_number: '',
    father_husband_number: '', mother_wife_number: '', alternate_number: '',
    account_holder_name: '', account_number: '', bank_name: '', ifsc_code: '', branch: '',
    education_qualification: '', year_of_passing: '', institute: '',
    official_email_crm: '', official_email_crm_date: '',
    signature_name: '',
    documents_submitted: JSON.stringify({}),
    previous_employment: JSON.stringify([]),
    background_verification: JSON.stringify({ type: '', address: { house_type: '' } })
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  React.useEffect(() => {
    const nameParam = searchParams.get('name');
    if (nameParam) {
      setFormData(prev => ({ ...prev, full_name: nameParam.toUpperCase() }));
    }
  }, [searchParams]);
  const [docs, setDocs] = useState({
    bank_passbook: null,
    pan_card: null,
    aadhaar_card: null,
    educational_certificate: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Numeric only validation
    const numericFields = [
      'contact_number', 'emergency_contact_number', 'father_husband_number', 
      'mother_wife_number', 'alternate_number', 'account_number', 'aadhaar_number'
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e, name) => {
    const file = e.target.files[0];
    if (file) {
      setDocs(prev => ({ ...prev, [name]: file }));
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  
  const addEmployment = () => {
    const current = JSON.parse(formData.previous_employment);
    setFormData(prev => ({
      ...prev,
      previous_employment: JSON.stringify([...current, { company: '', crm: '', designation: '', period: '' }])
    }));
  };

  const updateEmployment = (index, field, value) => {
    const current = JSON.parse(formData.previous_employment);
    current[index][field] = value.toUpperCase();
    setFormData(prev => ({ ...prev, previous_employment: JSON.stringify(current) }));
  };

  const updateBGC = (path, value) => {
    // Numeric validation for contact fields in BGC
    if (path.endsWith('mobile') || path.endsWith('contact')) {
        if (value !== '' && !/^\d+$/.test(value)) return;
    }

    const bgc = JSON.parse(formData.background_verification);
    // Simple path-based update for nested objects
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
    if (formData.aadhaar_number && formData.aadhaar_number.length !== 12) {
      alert("Aadhaar Number must be exactly 12 digits");
      return;
    }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.pan_number && !panRegex.test(formData.pan_number)) {
      alert("Invalid PAN Format (Sample: ASASA4569A)");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);
    Object.keys(docs).forEach(key => {
      if (docs[key]) data.append(key, docs[key]);
    });

    try {
      await axios.post(`${API_BASE_URL}/api/employees`, data);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Error submitting form');
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1: return (
        <div>
          <h3 className="section-title">1. PERSONAL INFORMATION</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>FILE NO. (AUTOMATIC)</label>
              <input name="file_no" value={formData.file_no} onChange={handleChange} placeholder="Assigned automatically if empty" />
            </div>
            <div className="form-group"><label>FULL NAME</label><input name="full_name" value={formData.full_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>FATHER'S / MOTHER'S NAME</label><input name="father_mother_name" value={formData.father_mother_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>DATE OF BIRTH</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} required /></div>
            <div className="form-group"><label>GENDER</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="form-group"><label>CONTACT NUMBER (+91)</label><input name="contact_number" value={formData.contact_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>BLOOD GROUP</label><input name="blood_group" value={formData.blood_group} onChange={handleChange} required /></div>
            <div className="form-group"><label>PERSONAL EMAIL ID</label><input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} style={{textTransform:'none'}} required /></div>
            <div className="form-group"><label>MARITAL STATUS</label>
               <select name="marital_status" value={formData.marital_status} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="SINGLE">SINGLE</option>
                <option value="MARRIED">MARRIED</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{marginTop:'1.5rem'}}><label>PRESENT ADDRESS</label><textarea name="present_address" value={formData.present_address} onChange={handleChange} required></textarea></div>
          <div className="form-group" style={{marginTop:'1.5rem'}}><label>PERMANENT ADDRESS</label><textarea name="permanent_address" value={formData.permanent_address} onChange={handleChange} required></textarea></div>
          <div className="form-group" style={{marginTop:'1.5rem'}}>
            <label>PHOTO (PASSPORT SIZE)</label>
            <p style={{background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
              <strong>PRO TIP:</strong> Please upload a <strong>neat and clear</strong> professional passport-size photo. This will be used for your official ID card.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="btn" style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
                <Upload size={18} style={{ marginRight: '0.5rem' }} /> Choose Image
                <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
              </label>
              {photoPreview && <img src={photoPreview} style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} alt="" />}
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div>
          <h3 className="section-title">2. EMPLOYMENT DETAILS</h3>
          <div className="form-grid">
            {/* Removed status selector as default is 'Trainee' */}
            <div className="form-group"><label>DEPARTMENT</label><input name="department" value={formData.department} onChange={handleChange} required /></div>
            <div className="form-group"><label>DESIGNATION</label><input name="designation" value={formData.designation} onChange={handleChange} required /></div>
            <div className="form-group"><label>DATE OF JOINING</label><input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} required /></div>
            {!isPublic && (
              <div className="form-group"><label>OFFICIAL JOINING DATE</label><input type="date" name="official_joining_date" value={formData.official_joining_date || ''} onChange={handleChange} /></div>
            )}
            <div className="form-group"><label>WORK LOCATION / BRANCH</label>
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
                  required
                />
              )}
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <h3 className="section-title">3. IDENTIFICATION & EMERGENCY</h3>
          <div className="form-grid">
            <div className="form-group"><label>PAN NUMBER</label><input name="pan_number" value={formData.pan_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>AADHAAR NUMBER</label><input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>OTHER ID (OPTIONAL)</label><input name="other_id" value={formData.other_id} onChange={handleChange} /></div>
          </div>
          <h4 style={{margin:'2rem 0 1rem', fontSize:'0.9rem'}}>EMERGENCY CONTACT</h4>
          <div className="form-grid">
            <div className="form-group"><label>NAME</label><input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>RELATIONSHIP</label><input name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleChange} required /></div>
            <div className="form-group"><label>CONTACT NUMBER</label><input name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>FATHER/HUSBAND NUMBER</label><input name="father_husband_number" value={formData.father_husband_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>MOTHER'S / WIFE NUMBER</label><input name="mother_wife_number" value={formData.mother_wife_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>ALTERNATE NUMBER</label><input name="alternate_number" value={formData.alternate_number} onChange={handleChange} required /></div>
          </div>
        </div>
      );
      case 4: return (
        <div>
           <h3 className="section-title">4. BANK DETAILS</h3>
           <div className="form-grid">
            <div className="form-group"><label>ACCOUNT HOLDER NAME</label><input name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>ACCOUNT NO.</label><input name="account_number" value={formData.account_number} onChange={handleChange} required /></div>
            <div className="form-group"><label>BANK NAME</label><input name="bank_name" value={formData.bank_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>IFSC CODE</label><input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} required /></div>
            <div className="form-group"><label>BRANCH</label><input name="branch" value={formData.branch} onChange={handleChange} required /></div>
          </div>
          <h3 className="section-title">5. EDUCATION</h3>
          <div className="form-grid">
            <div className="form-group"><label>QUALIFICATION</label><input name="education_qualification" value={formData.education_qualification} onChange={handleChange} required /></div>
            <div className="form-group"><label>YEAR OF PASSING</label><input name="year_of_passing" value={formData.year_of_passing} onChange={handleChange} required /></div>
            <div className="form-group"><label>INSTITUTE</label><input name="institute" value={formData.institute} onChange={handleChange} required /></div>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <h3 className="section-title">6. PREVIOUS EMPLOYMENT</h3>
          {JSON.parse(formData.previous_employment).map((job, idx) => (
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
          <p style={{background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
            <strong>NOTE:</strong> Please ensure all uploaded documents are <strong>neat and clear</strong> (PDFs or Images).
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label>BANK PASSBOOK</label>
              <input type="file" onChange={(e) => handleFileChange(e, 'bank_passbook')} accept="image/*,.pdf" />
              {docs.bank_passbook && <p style={{fontSize:'0.7rem', color:'#22c55e'}}>Selected: {docs.bank_passbook.name}</p>}
            </div>
            <div className="form-group">
              <label>PAN CARD</label>
              <input type="file" onChange={(e) => handleFileChange(e, 'pan_card')} accept="image/*,.pdf" />
              {docs.pan_card && <p style={{fontSize:'0.7rem', color:'#22c55e'}}>Selected: {docs.pan_card.name}</p>}
            </div>
            <div className="form-group">
              <label>AADHAAR CARD</label>
              <input type="file" onChange={(e) => handleFileChange(e, 'aadhaar_card')} accept="image/*,.pdf" />
              {docs.aadhaar_card && <p style={{fontSize:'0.7rem', color:'#22c55e'}}>Selected: {docs.aadhaar_card.name}</p>}
            </div>
            <div className="form-group">
              <label>EDUCATIONAL CERTIFICATE</label>
              <input type="file" onChange={(e) => handleFileChange(e, 'educational_certificate')} accept="image/*,.pdf" />
              {docs.educational_certificate && <p style={{fontSize:'0.7rem', color:'#22c55e'}}>Selected: {docs.educational_certificate.name}</p>}
            </div>
          </div>
        </div>
      );
      case 6: {
        const bgc = JSON.parse(formData.background_verification);
        return (
          <div>
            <h3 className="section-title">8. BACKGROUND VERIFICATION</h3>
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
                <p style={{fontSize:'0.7rem', color:'var(--text-dim)', marginBottom:'1rem'}}>Please provide details for either Reporting Manager or HR.</p>
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
                    <div className="form-group"><label>RELATIVE NAME</label><input value={bgc.relative?.name || ''} onChange={(e) => updateBGC('relative.name', e.target.value)} required /></div>
                    <div className="form-group"><label>DESIGNATION</label><input value={bgc.relative?.designation || ''} onChange={(e) => updateBGC('relative.designation', e.target.value)} required /></div>
                    <div className="form-group"><label>CONTACT NO.</label><input value={bgc.relative?.contact || ''} onChange={(e) => updateBGC('relative.contact', e.target.value)} required /></div>
                  </div>
                </div>

                <p style={{fontSize:'0.75rem', color:'var(--text-dim)', fontStyle:'italic', padding:'1rem', background:'rgba(255,255,255,0.05)', borderRadius:'8px'}}>
                  "I hereby give permission to the company to contact the above-mentioned references at any time for verification of the information provided by me during employment or background verification processes."
                </p>
              </div>
            )}
          </div>
        );
      }
      case 7: return (
        <div className="legal-consent-step">
          <h3 className="section-title">9. DECLARATION & CONSENT</h3>
          <div className="scroll-terms" style={{height:'350px', overflowY:'scroll', padding:'1.5rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--glass-border)', fontSize:'0.75rem', color:'var(--text-dim)', textAlign:'justify', marginBottom:'2rem'}}>
            <h4 style={{color:'white', marginBottom:'1rem'}}>CONSENT FORM</h4>
            <p>I, <strong>{formData.full_name || '________________________________'}</strong>, residing at <strong>{formData.present_address || '________________________________'}</strong>, hereby give my free, voluntary, specific, informed, and unconditional consent to ORBIX DESIGNS PRIVATE LIMITED for the purposes stated below.</p>
            
            <p style={{marginTop:'1.5rem', fontWeight:'bold', color:'white'}}>This consent is provided in connection with (tick as applicable):</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', margin:'1rem 0'}}>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" required /> Employment</label>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" required /> Use & Verification of Documents / Records</label>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" required /> Training / Orientation / Internship</label>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" required /> Data Collection, Storage & Processing</label>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" /> Client / Vendor / Consultant Relationship</label>
              <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" /> Other: _____________________</label>
            </div>

            <p style={{marginTop:'1.5rem', fontWeight:'bold', color:'white'}}>SCOPE OF CONSENT</p>
            <ol style={{paddingLeft:'1.2rem'}}>
              <li>Collection, storage, processing, and use of personal and professional information for lawful business purposes.</li>
              <li>Maintenance of records (physical/digital) as per policy and law.</li>
              <li>Internal sharing on a need-to-know basis.</li>
              <li>Work-related communication via official channels.</li>
              <li>Verification of documents if required.</li>
            </ol>

            <h5 style={{color:'white', marginTop:'1rem'}}>CONFIDENTIALITY & DATA PROTECTION</h5>
            <ul style={{paddingLeft:'1.2rem'}}>
              <li>All data will be treated confidentially.</li>
              <li>Reasonable security measures will be applied.</li>
              <li>No misuse or unauthorized disclosure of company information.</li>
            </ul>

            <h5 style={{color:'white', marginTop:'1rem'}}>DATA RETENTION & WITHDRAWAL</h5>
            <ul style={{paddingLeft:'1.2rem'}}>
              <li>Data may be retained as required by law.</li>
              <li>Withdrawal does not affect prior lawful processing.</li>
            </ul>

            <h5 style={{color:'white', marginTop:'1rem'}}>VOLUNTARY AGREEMENT</h5>
            <ul style={{paddingLeft:'1.2rem'}}>
              <li>Consent given without force or coercion.</li>
              <li>Terms read, understood, and accepted.</li>
              <li>Valid during and after association.</li>
            </ul>

            <h5 style={{color:'white', marginTop:'1rem'}}>LEGAL COMPLIANCE</h5>
            <p>As per Information Technology Act, 2000 and Digital Personal Data Protection Act, 2023 (India).</p>

            <h5 style={{color:'white', marginTop:'1rem'}}>DECLARATION</h5>
            <p>I declare that all information provided is true and correct. False information may attract action as per law.</p>

            <h5 style={{color:'white', marginTop:'1rem'}}>APPLICABLE LAW & JURISDICTION</h5>
            <p>Governed by laws of India. Courts of Chennai-Tamil Nadu shall have jurisdiction.</p>

            <hr style={{margin:'2rem 0', borderColor:'var(--glass-border)'}} />

            <h4 style={{color:'white', marginBottom:'1rem'}}>EMPLOYEE ACKNOWLEDGEMENT & DECLARATION (POSH Policy)</h4>
            <p>I hereby acknowledge that:</p>
            <ol style={{paddingLeft:'1.2rem'}}>
              <li>I have received, read, and clearly understood the Prevention of Sexual Harassment (POSH) Policy of Orbix, formulated in accordance with the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.</li>
              <li>I understand what constitutes sexual harassment and the complaint redressal mechanism provided by the company.</li>
              <li>I am aware of the Internal Committee (IC) constituted by Orbix and the procedure for reporting complaints.</li>
              <li>I agree to comply fully with the POSH Policy and maintain a respectful and harassment-free workplace.</li>
              <li>I understand that any violation of this policy may result in disciplinary action, including termination, as per company rules and applicable law.</li>
            </ol>

            <hr style={{margin:'2rem 0', borderColor:'var(--glass-border)'}} />

            <h4 style={{color:'white', marginBottom:'1rem'}}>WHISTLEBLOWER POLICY – DECLARATION</h4>
            <p>This is to inform all employees that Orbix Designs Pvt Ltd has adopted a Whistleblower Policy to promote ethical conduct, integrity, and transparency in the workplace. Employees are encouraged to report, in good faith, any unethical behavior, fraud, misconduct, or violation of company policies without fear of retaliation. The Company assures confidentiality and protection to whistleblowers raising genuine concerns. Any form of retaliation against a whistleblower is strictly prohibited and will attract strict disciplinary action. This policy is effective from 01 Jan 2026 and is applicable to all employees of Orbix Designs Pvt Ltd.</p>

            <hr style={{margin:'2rem 0', borderColor:'var(--glass-border)'}} />

            <h4 style={{color:'white', marginBottom:'1rem'}}>EMPLOYEE TERMS & CONDITIONS (Applicable to All Departments, Roles & Locations)</h4>
            <ol style={{paddingLeft:'1.2rem'}}>
              <li><strong>APPOINTMENT & APPLICABILITY:</strong> These Terms & Conditions apply uniformly to all employees of the Company across all departments, roles, and locations. Employment is subject to verification of documents, credentials, and background checks conducted by the Company.</li>
              <li><strong>TRAINING & CONFIRMATION:</strong> Training may be mandatory and unpaid. Confirmation of employment is subject to successful completion of training and probation. The Company reserves the right to discontinue employment if performance or conduct is found unsatisfactory.</li>
              <li><strong>COMPENSATION & DEDUCTIONS:</strong> Salary, incentives, and benefits are confidential. Salary is payable only for actual days worked. Unauthorized absence, late attendance, policy violations, or misconduct may result in Loss of Pay (LOP) or salary deductions.</li>
              <li><strong>WORKING HOURS & ATTENDANCE:</strong> Employees must strictly adhere to prescribed working hours and attendance rules. Late login, early logout, absenteeism, or manipulation of attendance records may attract disciplinary action.</li>
              <li><strong>LEAVE & PERMISSION POLICY:</strong> Leave eligibility is subject to tenure, approval, and company policy. Unauthorized leave, excess permissions, or misuse of leave entitlements shall be treated as Loss of Pay (LOP).</li>
              <li><strong>CONFIDENTIALITY & DATA PROTECTION:</strong> The Employee shall maintain strict confidentiality of all company data, client information, pricing, designs, documents, systems, and communications during and after employment. Any breach will be treated as serious misconduct.</li>
              <li><strong>CODE OF CONDUCT:</strong> Employees shall maintain professional conduct at all times. Use of abusive language, misrepresentation, harassment, or any behavior that harms the Company’s reputation is strictly prohibited.</li>
              <li><strong>SYSTEMS, SIM & OFFICIAL COMMUNICATION:</strong> Company systems, official SIM cards, emails, WhatsApp groups, software, and digital tools must be used strictly for authorized business purposes only.</li>
              <li><strong>TRANSFER, ROLE CHANGE & MANAGEMENT RIGHTS:</strong> The Company reserves the right to transfer, reassign, modify duties, reporting structures, or work locations based on business requirements without prior notice.</li>
              <li><strong>DISCIPLINARY ACTION:</strong> Violation of any policy may result in disciplinary action including warning, suspension, salary deduction, or termination, depending on the severity of the violation.</li>
              <li><strong>TERMINATION & NOTICE PERIOD:</strong> Resignation must be submitted in writing as per Company notice period policy. Failure to serve the complete notice period will result in salary recovery or adjustment against final settlement.</li>
              <li><strong>FINAL SETTLEMENT & DOCUMENT RETURN:</strong> Final settlement will be processed only after full departmental clearance. Original documents, if submitted, will be returned within the stipulated timeline after completion of exit formalities.</li>
              <li><strong>COMPANY RIGHTS:</strong> The Company reserves absolute rights to amend, modify, suspend, or withdraw any policy, benefit, or condition at its sole discretion without prior notice.</li>
              <li><strong>GOVERNING LAW:</strong> These Terms & Conditions shall be governed by and construed in accordance with the laws of India.</li>
            </ol>

            <h5 style={{color:'white', marginTop:'1rem'}}>Employee Declaration</h5>
            <p>I hereby confirm that all the above statements are true and correct to the best of my knowledge.</p>
          </div>
          <div className="form-group">
            <label>DIGITAL SIGNATURE (TYPE FULL NAME)</label>
            <input name="signature_name" value={formData.signature_name || ''} onChange={handleChange} placeholder="Type name to sign" required />
          </div>
        </div>
      );
      default: return null;
    }
  };

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
          Form Submitted Successfully!
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
          Thank you for completing the onboarding process. Your information has been securely received by our HR department.
        </p>
        
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '0.875rem', color: '#60a5fa', fontWeight: 600 }}>
            {isPublic ? 'You may now close this window safely.' : 'Reviewing your submission...'}
          </p>
          {!isPublic && (
            <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
              Go to Dashboard
            </button>
          )}
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {logo && <img src={logo} alt="Orbix" style={{ height: '40px', width: 'auto' }} />}
            {isPublic ? 'Employee Onboarding Form' : 'Add New Employee'}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Please fill all fields in CAPITAL letters as requested.</p>
        </div>
        <div className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          Step {step} of 7
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
            
            {step < 7 ? (
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none' }}>
                <Save size={18} /> Complete Onboarding
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
