import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Save, Upload } from 'lucide-react';
import API_BASE_URL from '../config';

const Onboarding = ({ isPublic }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    status: 'Onboard',
    file_no: '', full_name: '', father_mother_name: '', dob: '', gender: '', contact_number: '', blood_group: '', 
    personal_email: '', marital_status: '', present_address: '', permanent_address: '',
    employee_id: '', department: '', designation: '', date_of_joining: '', work_location: '', reporting_manager: '',
    pan_number: '', aadhaar_number: '', other_id: '',
    emergency_contact_name: '', emergency_contact_relationship: '', emergency_contact_number: '', 
    father_husband_number: '', mother_wife_number: '', alternate_number: '',
    account_holder_name: '', account_number: '', bank_name: '', ifsc_code: '', branch: '',
    education_qualification: '', year_of_passing: '', institute: '',
    official_email_crm: '', official_email_crm_date: '',
    signature_name: '',
    documents_submitted: JSON.stringify({}),
    previous_employment: JSON.stringify([])
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [docs, setDocs] = useState({
    bank_passbook: null,
    pan_card: null,
    aadhaar_card: null,
    educational_certificate: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only apply uppercase to fields that are NOT email-related
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);
    Object.keys(docs).forEach(key => {
      if (docs[key]) data.append(key, docs[key]);
    });

    try {
      await axios.post(`${API_BASE_URL}/api/employees`, data);
      alert('Employee onboarded successfully!');
      navigate('/');
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
            <div className="form-group"><label>FILE NO.</label><input name="file_no" value={formData.file_no} onChange={handleChange} /></div>
            <div className="form-group"><label>FULL NAME</label><input name="full_name" value={formData.full_name} onChange={handleChange} /></div>
            <div className="form-group"><label>FATHER'S / MOTHER'S NAME</label><input name="father_mother_name" value={formData.father_mother_name} onChange={handleChange} /></div>
            <div className="form-group"><label>DATE OF BIRTH</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} /></div>
            <div className="form-group"><label>GENDER</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="form-group"><label>CONTACT NUMBER (+91)</label><input name="contact_number" value={formData.contact_number} onChange={handleChange} /></div>
            <div className="form-group"><label>BLOOD GROUP</label><input name="blood_group" value={formData.blood_group} onChange={handleChange} /></div>
            <div className="form-group"><label>PERSONAL EMAIL ID</label><input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} style={{textTransform:'none'}} /></div>
            <div className="form-group"><label>MARITAL STATUS</label>
               <select name="marital_status" value={formData.marital_status} onChange={handleChange}>
                <option value="">Select</option>
                <option value="SINGLE">SINGLE</option>
                <option value="MARRIED">MARRIED</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{marginTop:'1.5rem'}}><label>PRESENT ADDRESS</label><textarea name="present_address" value={formData.present_address} onChange={handleChange}></textarea></div>
          <div className="form-group" style={{marginTop:'1.5rem'}}><label>PERMANENT ADDRESS</label><textarea name="permanent_address" value={formData.permanent_address} onChange={handleChange}></textarea></div>
          <div className="form-group" style={{marginTop:'1.5rem'}}>
            <label>PHOTO (PASSPORT SIZE)</label>
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
            <div className="form-group"><label>EMPLOYEE STATUS</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Trainee">TRAINEE</option>
                <option value="Onboard">ONBOARD</option>
                <option value="Current Employee">CURRENT EMPLOYEE</option>
                <option value="Bix Employee">BIX EMPLOYEE</option>
                <option value="Bench">BENCH (NOTICE PERIOD)</option>
                <option value="Resigned">RESIGNED</option>
              </select>
            </div>
            <div className="form-group"><label>EMPLOYEE ID</label><input name="employee_id" value={formData.employee_id} onChange={handleChange} /></div>
            <div className="form-group"><label>DEPARTMENT</label><input name="department" value={formData.department} onChange={handleChange} /></div>
            <div className="form-group"><label>DESIGNATION</label><input name="designation" value={formData.designation} onChange={handleChange} /></div>
            <div className="form-group"><label>DATE OF JOINING</label><input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} /></div>
            <div className="form-group"><label>WORK LOCATION / BRANCH</label><input name="work_location" value={formData.work_location} onChange={handleChange} /></div>
            <div className="form-group"><label>REPORTING MANAGER</label><input name="reporting_manager" value={formData.reporting_manager} onChange={handleChange} /></div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <h3 className="section-title">3. IDENTIFICATION & EMERGENCY</h3>
          <div className="form-grid">
            <div className="form-group"><label>PAN NUMBER</label><input name="pan_number" value={formData.pan_number} onChange={handleChange} /></div>
            <div className="form-group"><label>AADHAAR NUMBER</label><input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} /></div>
            <div className="form-group"><label>OTHER ID (IF ANY)</label><input name="other_id" value={formData.other_id} onChange={handleChange} /></div>
          </div>
          <h4 style={{margin:'2rem 0 1rem', fontSize:'0.9rem'}}>EMERGENCY CONTACT</h4>
          <div className="form-grid">
            <div className="form-group"><label>NAME</label><input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} /></div>
            <div className="form-group"><label>RELATIONSHIP</label><input name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleChange} /></div>
            <div className="form-group"><label>CONTACT NUMBER</label><input name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} /></div>
            <div className="form-group"><label>FATHER/HUSBAND NUMBER</label><input name="father_husband_number" value={formData.father_husband_number} onChange={handleChange} /></div>
            <div className="form-group"><label>MOTHER'S / WIFE NUMBER</label><input name="mother_wife_number" value={formData.mother_wife_number} onChange={handleChange} /></div>
            <div className="form-group"><label>ALTERNATE NUMBER</label><input name="alternate_number" value={formData.alternate_number} onChange={handleChange} /></div>
          </div>
        </div>
      );
      case 4: return (
        <div>
           <h3 className="section-title">4. BANK DETAILS</h3>
           <div className="form-grid">
            <div className="form-group"><label>ACCOUNT HOLDER NAME</label><input name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} /></div>
            <div className="form-group"><label>ACCOUNT NO.</label><input name="account_number" value={formData.account_number} onChange={handleChange} /></div>
            <div className="form-group"><label>BANK NAME</label><input name="bank_name" value={formData.bank_name} onChange={handleChange} /></div>
            <div className="form-group"><label>IFSC CODE</label><input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} /></div>
            <div className="form-group"><label>BRANCH</label><input name="branch" value={formData.branch} onChange={handleChange} /></div>
          </div>
          <h3 className="section-title">5. EDUCATION</h3>
          <div className="form-grid">
            <div className="form-group"><label>QUALIFICATION</label><input name="education_qualification" value={formData.education_qualification} onChange={handleChange} /></div>
            <div className="form-group"><label>YEAR OF PASSING</label><input name="year_of_passing" value={formData.year_of_passing} onChange={handleChange} /></div>
            <div className="form-group"><label>INSTITUTE</label><input name="institute" value={formData.institute} onChange={handleChange} /></div>
          </div>
          <h3 className="section-title">5. OFFICE ASSETS & SYSTEMS</h3>
          <div className="form-grid">
            <div className="form-group"><label>OFFICE SIM</label><input name="office_sim" value={formData.office_sim} onChange={handleChange} /></div>
            <div className="form-group"><label>SIM ALLOCATED DATE</label><input type="date" name="office_sim_date" value={formData.office_sim_date} onChange={handleChange} /></div>
            <div className="form-group"><label>LAPTOP/SYSTEM</label><input name="laptop_system" value={formData.laptop_system} onChange={handleChange} /></div>
            <div className="form-group"><label>LAPTOP ALLOCATED DATE</label><input type="date" name="laptop_system_date" value={formData.laptop_system_date} onChange={handleChange} /></div>
            <div className="form-group"><label>OFFICIAL EMAIL/CRM</label><input name="official_email_crm" value={formData.official_email_crm} onChange={handleChange} /></div>
            <div className="form-group"><label>CRM ALLOCATED DATE</label><input type="date" name="official_email_crm_date" value={formData.official_email_crm_date} onChange={handleChange} /></div>
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
                <div className="form-group"><label>CRM</label><input value={job.crm} onChange={(e) => updateEmployment(idx, 'crm', e.target.value)} /></div>
                <div className="form-group"><label>DESIGNATION</label><input value={job.designation} onChange={(e) => updateEmployment(idx, 'designation', e.target.value)} /></div>
                <div className="form-group"><label>PERIOD</label><input value={job.period} onChange={(e) => updateEmployment(idx, 'period', e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addEmployment} className="btn btn-secondary" style={{width:'100%', border:'1px dashed var(--glass-border)'}}>+ Add Employment History</button>
          
          <h3 className="section-title" style={{marginTop:'3rem'}}>7. SUPPORTING DOCUMENTS (UPLOAD)</h3>
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
      case 6: return (
        <div>
          <h3 className="section-title">8. DECLARATION & CONSENT</h3>
          <div className="card" style={{fontSize:'0.85rem', color:'var(--text-dim)', marginBottom:'2rem'}}>
            <p>I hereby declare that all the above information is true to the best of my knowledge. I understand that any false information may lead to termination. I also acknowledge that the original certificates submitted will be returned upon completion of exit formalities.</p>
            <p style={{marginTop:'1rem'}}>I give my free, voluntary, specific, informed, and unconditional consent to ORBIX DESIGNS PRIVATE LIMITED for Data Collection, Storage & Processing.</p>
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
      <div className="card slide-in" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ background: '#22c55e', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Save color="white" size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Form Submitted Successfully!</h2>
        <p style={{ color: 'var(--text-dim)' }}>Your information has been securely received. {isPublic ? 'You can now close this window.' : 'Redirecting to dashboard...'}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isPublic ? 'Employee Onboarding Form' : 'Add New Employee'}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Please fill all fields in CAPITAL letters as requested.</p>
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
