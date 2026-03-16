const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5018;

// Email Transporter (Mock)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'trey.schulist@ethereal.email',
      pass: 'P8W4K5J9V7Y2N1X6'
  }
});

const sendOnboardingEmail = (employee) => {
  const mailOptions = {
    from: '"HR Systems" <hr@orbixdesigns.com>',
    to: employee.personal_email || 'hr-notifs@orbixdesigns.com',
    subject: `New Onboarding Submission: ${employee.full_name}`,
    html: `
      <h2>New Employee Onboarded</h2>
      <p>A new employee record has been created for <strong>${employee.full_name}</strong>.</p>
      <p><strong>Designation:</strong> ${employee.designation}</p>
      <p><strong>Department:</strong> ${employee.department}</p>
      <p>Please review the record in the Admin Dashboard.</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return console.log('Mail error:', error);
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  });
};

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      res.json({ id: user.id, username: user.username });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'bank_passbook', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
  { name: 'aadhaar_card', maxCount: 1 },
  { name: 'educational_certificate', maxCount: 1 }
]);

// Routes
app.get('/api/employees', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM employees';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/employees/:id', (req, res) => {
  db.get('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  });
});

app.post('/api/employees', upload, async (req, res) => {
  const data = req.body;
  const files = req.files || {};
  
  const photo_path = files.photo ? `/uploads/${files.photo[0].filename}` : null;
  const bank_passbook_path = files.bank_passbook ? `/uploads/${files.bank_passbook[0].filename}` : null;
  const pan_card_path = files.pan_card ? `/uploads/${files.pan_card[0].filename}` : null;
  const aadhaar_card_path = files.aadhaar_card ? `/uploads/${files.aadhaar_card[0].filename}` : null;
  const educational_certificate_path = files.educational_certificate ? `/uploads/${files.educational_certificate[0].filename}` : null;

  let file_no = data.file_no;
  if (!file_no || file_no === 'undefined' || file_no === '') {
    // Generate automatic file no: HRM/26/XXX
    const lastEmp = await new Promise((resolve) => {
      db.get("SELECT file_no FROM employees WHERE file_no LIKE 'HRM/26/%' ORDER BY file_no DESC LIMIT 1", (err, row) => {
        resolve(row);
      });
    });

    let nextNum = 1;
    if (lastEmp && lastEmp.file_no) {
      const parts = lastEmp.file_no.split('/');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    file_no = `HRM/26/${String(nextNum).padStart(3, '0')}`;
  }

  const query = `
    INSERT INTO employees (
      status, file_no, full_name, father_mother_name, dob, gender, contact_number, blood_group, 
      personal_email, marital_status, present_address, permanent_address, photo_path,
      employee_id, department, designation, date_of_joining, work_location, reporting_manager,
      pan_number, aadhaar_number, other_id,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_number, 
      father_husband_number, mother_wife_number, alternate_number,
      account_holder_name, account_number, bank_name, ifsc_code, branch,
      documents_submitted, education_qualification, year_of_passing, institute, previous_employment,
      office_sim, office_sim_date, laptop_system, laptop_system_date, official_email_crm, official_email_crm_date,
      asset_crm, asset_peopledesk, asset_projects, asset_id_card, asset_official_mail, asset_offer_letter,
      check_sim, check_laptop, check_crm, check_peopledesk, check_projects, check_id_card, check_official_mail, check_offer_letter,
      bank_passbook_path, pan_card_path, aadhaar_card_path, educational_certificate_path, signature_name, background_verification
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const params = [
    data.status || 'Onboard', file_no, data.full_name, data.father_mother_name, data.dob, data.gender, data.contact_number, data.blood_group,
    data.personal_email, data.marital_status, data.present_address, data.permanent_address, photo_path,
    data.employee_id, data.department, data.designation, data.date_of_joining, data.work_location, data.reporting_manager,
    data.pan_number, data.aadhaar_number, data.other_id,
    data.emergency_contact_name, data.emergency_contact_relationship, data.emergency_contact_number,
    data.father_husband_number, data.mother_wife_number, data.alternate_number,
    data.account_holder_name, data.account_number, data.bank_name, data.ifsc_code, data.branch,
    data.documents_submitted, data.education_qualification, data.year_of_passing, data.institute, data.previous_employment,
    data.office_sim, data.office_sim_date, data.laptop_system, data.laptop_system_date, data.official_email_crm, data.official_email_crm_date,
    data.asset_crm, data.asset_peopledesk, data.asset_projects, data.asset_id_card, data.asset_official_mail, data.asset_offer_letter,
    data.check_sim || 0, data.check_laptop || 0, data.check_crm || 0, data.check_peopledesk || 0, data.check_projects || 0, data.check_id_card || 0, data.check_official_mail || 0, data.check_offer_letter || 0,
    bank_passbook_path, pan_card_path, aadhaar_card_path, educational_certificate_path, data.signature_name, data.background_verification
  ];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    sendOnboardingEmail({ ...data, id: this.lastID });
    res.json({ id: this.lastID, ...data, photo_path });
  });
});

app.post('/api/employees/bulk', async (req, res) => {
  const { employees } = req.body;
  if (!employees || !Array.isArray(employees)) {
    return res.status(400).json({ error: 'Invalid data format.' });
  }

  let successCount = 0;
  let errorCount = 0;

  // Get current max file_no sequence
  const lastEmp = await new Promise((resolve) => {
    db.get("SELECT file_no FROM employees WHERE file_no LIKE 'HRM/26/%' ORDER BY file_no DESC LIMIT 1", (err, row) => {
      resolve(row);
    });
  });

  let nextNum = 1;
  if (lastEmp && lastEmp.file_no) {
    const parts = lastEmp.file_no.split('/');
    const lastNum = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  const validKeys = [
    "status", "file_no", "full_name", "father_mother_name", "dob", "gender", "contact_number", "blood_group", 
    "personal_email", "marital_status", "present_address", "permanent_address", "employee_id", "department", 
    "designation", "date_of_joining", "work_location", "reporting_manager", "pan_number", "aadhaar_number", 
    "other_id", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number", 
    "father_husband_number", "mother_wife_number", "alternate_number", "account_holder_name", 
    "account_number", "bank_name", "ifsc_code", "branch", "documents_submitted", "education_qualification", 
    "year_of_passing", "institute", "previous_employment", "office_sim", "office_sim_date", 
    "laptop_system", "laptop_system_date", "official_email_crm", "official_email_crm_date", 
    "asset_crm", "asset_peopledesk", "asset_projects", "asset_id_card", "asset_official_mail", "asset_offer_letter",
    "check_sim", "check_laptop", "check_crm", "check_peopledesk", "check_projects", "check_id_card", "check_official_mail", "check_offer_letter",
    "signature_name", "background_verification"
  ];

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    employees.forEach(emp => {
      // Auto-generate file_no if missing
      if (!emp.file_no || emp.file_no === '') {
        emp.file_no = `HRM/26/${String(nextNum++).padStart(3, '0')}`;
      }

      const keys = Object.keys(emp).filter(k => validKeys.includes(k));
      if (keys.length === 0) {
        errorCount++;
        return;
      }

      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => (typeof emp[k] === 'object') ? JSON.stringify(emp[k]) : emp[k]);
      
      const query = `INSERT INTO employees (${keys.join(',')}) VALUES (${placeholders})`;
      db.run(query, values, (err) => {
        if (err) {
          console.error('Bulk Insert Error:', err.message);
          errorCount++;
        } else {
          successCount++;
        }
      });
    });

    db.run('COMMIT', (err) => {
      if (err) return res.status(500).json({ error: 'Transaction failed' });
      res.json({ message: 'Bulk import completed', total: employees.length, success: successCount, errors: errorCount });
    });
  });
});

app.put('/api/employees/:id', upload, (req, res) => {
  const data = req.body;
  const files = req.files || {};
  
  const photo_path = files.photo ? `/uploads/${files.photo[0].filename}` : data.photo_path;
  const bank_passbook_path = files.bank_passbook ? `/uploads/${files.bank_passbook[0].filename}` : data.bank_passbook_path;
  const pan_card_path = files.pan_card ? `/uploads/${files.pan_card[0].filename}` : data.pan_card_path;
  const aadhaar_card_path = files.aadhaar_card ? `/uploads/${files.aadhaar_card[0].filename}` : data.aadhaar_card_path;
  const educational_certificate_path = files.educational_certificate ? `/uploads/${files.educational_certificate[0].filename}` : data.educational_certificate_path;

  const query = `
    UPDATE employees SET 
      status=?, file_no=?, full_name=?, father_mother_name=?, dob=?, gender=?, contact_number=?, blood_group=?, 
      personal_email=?, marital_status=?, present_address=?, permanent_address=?, photo_path=?,
      employee_id=?, department=?, designation=?, date_of_joining=?, work_location=?, reporting_manager=?,
      pan_number=?, aadhaar_number=?, other_id=?,
      emergency_contact_name=?, emergency_contact_relationship=?, emergency_contact_number=?, 
      father_husband_number=?, mother_wife_number=?, alternate_number=?,
      account_holder_name=?, account_number=?, bank_name=?, ifsc_code=?, branch=?,
      documents_submitted=?, education_qualification=?, year_of_passing=?, institute=?,
      previous_employment=?, office_sim=?, office_sim_date=?, laptop_system=?, 
      laptop_system_date=?, official_email_crm=?, official_email_crm_date=?,
      asset_crm=?, asset_peopledesk=?, asset_projects=?, asset_id_card=?, asset_official_mail=?, asset_offer_letter=?,
      check_sim=?, check_laptop=?, check_crm=?, check_peopledesk=?, check_projects=?, check_id_card=?, check_official_mail=?, check_offer_letter=?,
      bank_passbook_path=?, pan_card_path=?, aadhaar_card_path=?, educational_certificate_path=?, signature_name=?, background_verification=?
    WHERE id = ?
  `;

  const params = [
    data.status, data.file_no, data.full_name, data.father_mother_name, data.dob, data.gender, data.contact_number, data.blood_group,
    data.personal_email, data.marital_status, data.present_address, data.permanent_address, photo_path,
    data.employee_id, data.department, data.designation, data.date_of_joining, data.work_location, data.reporting_manager,
    data.pan_number, data.aadhaar_number, data.other_id,
    data.emergency_contact_name, data.emergency_contact_relationship, data.emergency_contact_number,
    data.father_husband_number, data.mother_wife_number, data.alternate_number,
    data.account_holder_name, data.account_number, data.bank_name, data.ifsc_code, data.branch,
    data.documents_submitted, data.education_qualification, data.year_of_passing, data.institute,
    data.previous_employment, data.office_sim, data.office_sim_date, data.laptop_system, 
    data.laptop_system_date, data.official_email_crm, data.official_email_crm_date,
    data.asset_crm, data.asset_peopledesk, data.asset_projects, data.asset_id_card, data.asset_official_mail, data.asset_offer_letter,
    data.check_sim || 0, data.check_laptop || 0, data.check_crm || 0, data.check_peopledesk || 0, data.check_projects || 0, data.check_id_card || 0, data.check_official_mail || 0, data.check_offer_letter || 0,
    bank_passbook_path, pan_card_path, aadhaar_card_path, educational_certificate_path, data.signature_name, data.background_verification,
    req.params.id
  ];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Employee updated successfully' });
  });
});

app.delete('/api/employees/:id', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Employee deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
