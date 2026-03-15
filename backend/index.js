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
app.use(bodyParser.json());
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
const upload = multer({ storage });

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

app.post('/api/employees', upload.single('photo'), (req, res) => {
  const data = req.body;
  const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

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
      office_sim, office_sim_date, laptop_system, laptop_system_date, official_email_crm, official_email_crm_date
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const params = [
    data.status || 'Onboard', data.file_no, data.full_name, data.father_mother_name, data.dob, data.gender, data.contact_number, data.blood_group,
    data.personal_email, data.marital_status, data.present_address, data.permanent_address, photo_path,
    data.employee_id, data.department, data.designation, data.date_of_joining, data.work_location, data.reporting_manager,
    data.pan_number, data.aadhaar_number, data.other_id,
    data.emergency_contact_name, data.emergency_contact_relationship, data.emergency_contact_number,
    data.father_husband_number, data.mother_wife_number, data.alternate_number,
    data.account_holder_name, data.account_number, data.bank_name, data.ifsc_code, data.branch,
    data.documents_submitted, data.education_qualification, data.year_of_passing, data.institute, data.previous_employment,
    data.office_sim, data.office_sim_date, data.laptop_system, data.laptop_system_date, data.official_email_crm, data.official_email_crm_date
  ];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    sendOnboardingEmail({ ...data, id: this.lastID });
    res.json({ id: this.lastID, ...data, photo_path });
  });
});

app.post('/api/employees/bulk', (req, res) => {
  const { employees } = req.body;
  if (!employees || !Array.isArray(employees)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array of employees.' });
  }

  const query = `
    INSERT INTO employees (
      status, full_name, department, designation, personal_email, contact_number, employee_id
    ) VALUES (?,?,?,?,?,?,?)
  `;

  const stmt = db.prepare(query);
  let errors = 0;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    employees.forEach(emp => {
      stmt.run([
        emp.status || 'Working',
        emp.full_name || emp.fullName || emp.Name,
        emp.department || emp.Dept,
        emp.designation,
        emp.personal_email || emp.personalEmail || emp.email,
        emp.contact_number || emp.contact,
        emp.employee_id || emp.empId
      ], (err) => {
        if (err) errors++;
      });
    });
    db.run('COMMIT', (err) => {
      if (err) return res.status(500).json({ error: 'Transaction failed' });
      res.json({ message: 'Bulk import completed', count: employees.length, errors });
    });
  });
  stmt.finalize();
});

app.put('/api/employees/:id', upload.single('photo'), (req, res) => {
  const data = req.body;
  const photo_path = req.file ? `/uploads/${req.file.filename}` : data.photo_path;
  
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
      laptop_system_date=?, official_email_crm=?, official_email_crm_date=?
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
    req.params.id
  ];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Employee updated successfully' });
  });
});

app.patch('/api/employees/:id', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE employees SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Status updated' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
