const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 5018;
const backupsDir = path.join(__dirname, 'backups');
const envFilePath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

const sendBackupEmail = async (backupRecord) => {
  const attachments = [];

  if (backupRecord.jsonPath && fs.existsSync(backupRecord.jsonPath)) {
    attachments.push({
      filename: path.basename(backupRecord.jsonPath),
      path: backupRecord.jsonPath
    });
  }

  if (backupRecord.envPath && fs.existsSync(backupRecord.envPath)) {
    attachments.push({
      filename: path.basename(backupRecord.envPath),
      path: backupRecord.envPath
    });
  }

  const mailOptions = {
    from: '"HR Systems" <hr@orbixdesigns.com>',
    to: process.env.BACKUP_EMAIL_TO || process.env.BACKUP_EMAIL || 'hr-notifs@orbixdesigns.com',
    subject: `Nightly HRM Backup - ${backupRecord.createdAt}`,
    html: `
      <h2>Nightly backup completed</h2>
      <p>Backup time: <strong>${backupRecord.createdAt}</strong></p>
      <p>Employees exported: <strong>${backupRecord.employeeCount}</strong></p>
      <p>Backup file: <strong>${backupRecord.jsonFileName}</strong></p>
      <p>Environment file: <strong>${backupRecord.envFileName}</strong></p>
    `,
    attachments
  };

  return new Promise((resolve) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Backup mail error:', error.message);
        return resolve({ ok: false, error: error.message });
      }

      console.log('Backup email sent: %s', info.messageId);
      resolve({ ok: true, messageId: info.messageId });
    });
  });
};

const getSafeEnvSnapshot = () => {
  const keys = [
    'PORT',
    'NODE_ENV',
    'BACKUP_EMAIL_TO',
    'BACKUP_EMAIL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID'
  ];

  const lines = [];
  keys.forEach((key) => {
    if (process.env[key]) {
      lines.push(`${key}=${process.env[key]}`);
    }
  });

  if (lines.length === 0 && fs.existsSync(envFilePath)) {
    return fs.readFileSync(envFilePath, 'utf8');
  }

  if (lines.length === 0 && fs.existsSync(envExamplePath)) {
    return fs.readFileSync(envExamplePath, 'utf8');
  }

  return lines.join('\n') + '\n';
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isSqliteBusy = (error) => {
  return error && (error.code === 'SQLITE_BUSY' || error.message?.includes('SQLITE_BUSY'));
};

const withSqliteBusyRetry = async (operation, retries = 5) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isSqliteBusy(error) || attempt === retries) break;
      await wait(250 * (attempt + 1));
    }
  }

  throw lastError;
};

const createBackupSnapshot = () => {
  const createdAt = new Date();
  const stamp = createdAt.toISOString().replace(/[:.]/g, '-');
  const jsonFileName = `employees-backup-${stamp}.json`;
  const envFileName = `env-backup-${stamp}.env`;
  const sqliteFileName = `database-backup-${stamp}.sqlite`;
  const jsonPath = path.join(backupsDir, jsonFileName);
  const envPath = path.join(backupsDir, envFileName);
  const sqlitePath = path.join(backupsDir, sqliteFileName);

  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM employees ORDER BY id ASC', [], async (err, employees) => {
      if (err) return reject(err);

      const payload = {
        createdAt: createdAt.toISOString(),
        employeeCount: employees.length,
        source: 'sqlite-employees-table',
        sqliteFileName,
        employees
      };

      try {
        await withSqliteBusyRetry(() => new Promise((backupResolve, backupReject) => {
          db.backup(sqlitePath, (backupErr) => {
            if (backupErr) return backupReject(backupErr);
            backupResolve();
          });
        }));

        fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
        fs.writeFileSync(envPath, getSafeEnvSnapshot(), 'utf8');
      } catch (backupError) {
        return reject(backupError);
      }

      resolve({
        createdAt: createdAt.toISOString(),
        employeeCount: employees.length,
        jsonFileName,
        jsonPath,
        envFileName,
        envPath,
        sqliteFileName,
        sqlitePath
      });
    });
  });
};

const listBackupFiles = () => {
  if (!fs.existsSync(backupsDir)) return [];

  return fs.readdirSync(backupsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const jsonPath = path.join(backupsDir, file);
      const stat = fs.statSync(jsonPath);
      const envPath = path.join(backupsDir, file.replace(/^employees-backup-/, 'env-backup-').replace(/\.json$/, '.env'));
      const sqlitePath = path.join(backupsDir, file.replace(/^employees-backup-/, 'database-backup-').replace(/\.json$/, '.sqlite'));
      return {
        fileName: file,
        envFileName: path.basename(envPath),
        sqliteFileName: path.basename(sqlitePath),
        jsonPath,
        envPath,
        sqlitePath,
        size: stat.size,
        createdAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const scheduleNightlyBackup = () => {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(2, 0, 0, 0);
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const delay = nextRun.getTime() - now.getTime();

  setTimeout(async () => {
    try {
      const backupRecord = await createBackupSnapshot();
      await sendBackupEmail(backupRecord);
    } catch (error) {
      console.error('Scheduled backup failed:', error.message);
    } finally {
      scheduleNightlyBackup();
    }
  }, delay);

  console.log(`Nightly backup scheduled for ${nextRun.toISOString()}`);
};

const restoreEmployeesFromBackup = (backupEmployees) => {
  return withSqliteBusyRetry(() => new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE TRANSACTION', (beginErr) => {
        if (beginErr) return reject(beginErr);

        db.run('DELETE FROM employees', (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }

          db.run("DELETE FROM sqlite_sequence WHERE name = 'employees'", (sequenceErr) => {
            if (sequenceErr) {
              db.run('ROLLBACK');
              return reject(sequenceErr);
            }

            if (!Array.isArray(backupEmployees) || backupEmployees.length === 0) {
              db.run('COMMIT', (commitErr) => {
                if (commitErr) return reject(commitErr);
                resolve(0);
              });
              return;
            }

            const columns = Object.keys(backupEmployees[0]).filter((key) => key !== 'created_at');
            const placeholders = columns.map(() => '?').join(',');
            const insertQuery = `INSERT INTO employees (${columns.join(',')}) VALUES (${placeholders})`;

            let index = 0;
            const insertNext = () => {
              if (index >= backupEmployees.length) {
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) return reject(commitErr);
                  resolve(backupEmployees.length);
                });
                return;
              }

              const employee = backupEmployees[index++];
              const values = columns.map((column) => {
                const value = employee[column];
                return typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
              });

              db.run(insertQuery, values, (insertErr) => {
                if (insertErr) {
                  db.run('ROLLBACK');
                  return reject(insertErr);
                }
                insertNext();
              });
            };

            insertNext();
          });
        });
      });
    });
  }));
};

app.get('/api/backups', (req, res) => {
  res.json(listBackupFiles().map((backup) => ({
    fileName: backup.fileName,
    envFileName: backup.envFileName,
    sqliteFileName: backup.sqliteFileName,
    size: backup.size,
    createdAt: backup.createdAt,
    downloadJsonUrl: `/api/backups/${encodeURIComponent(backup.fileName)}/download`,
    downloadEnvUrl: `/api/backups/${encodeURIComponent(backup.envFileName)}/download`,
    downloadSqliteUrl: `/api/backups/${encodeURIComponent(backup.sqliteFileName)}/download`,
    restoreUrl: `/api/backups/${encodeURIComponent(backup.fileName)}/restore`
  })));
});

app.post('/api/backups/create', async (req, res) => {
  try {
    const backupRecord = await createBackupSnapshot();
    sendBackupEmail(backupRecord).catch((error) => {
      console.error('Backup email failed:', error.message);
    });

    res.json({
      message: 'Backup created successfully',
      backup: {
        fileName: backupRecord.jsonFileName,
        envFileName: backupRecord.envFileName,
        createdAt: backupRecord.createdAt,
        employeeCount: backupRecord.employeeCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/backups/:fileName/download', (req, res) => {
  const filePath = path.join(backupsDir, req.params.fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  res.download(filePath);
});

app.get('/api/backups/:fileName/json', (req, res) => {
  const filePath = path.join(backupsDir, req.params.fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  try {
    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ error: 'Unable to parse backup JSON file' });
  }
});

app.post('/api/backups/:fileName/restore', async (req, res) => {
  try {
    const filePath = path.join(backupsDir, req.params.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const restoredCount = await restoreEmployeesFromBackup(backupData.employees || []);

    res.json({
      message: 'Backup restored successfully',
      restoredCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backups/restore-from-json', async (req, res) => {
  try {
    const { backup } = req.body;
    if (!backup || !Array.isArray(backup.employees)) {
      return res.status(400).json({ error: 'Valid backup JSON payload is required' });
    }

    const restoredCount = await restoreEmployeesFromBackup(backup.employees);
    res.json({
      message: 'Backup restored successfully',
      restoredCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Auth API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    console.log(match)
    if (match) {
      res.json({ id: user.id, username: user.username, role: user.role });
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
  { name: 'bank_passbook_back', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
  { name: 'pan_card_back', maxCount: 1 },
  { name: 'aadhaar_card', maxCount: 1 },
  { name: 'aadhaar_card_back', maxCount: 1 },
  { name: 'educational_certificate', maxCount: 1 },
  { name: 'educational_certificate_back', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

const buildEmployeeUpdate = (data, files, employeeId) => {
  const photo_path = files.photo ? `/uploads/${files.photo[0].filename}` : data.photo_path;
  const bank_passbook_path = files.bank_passbook ? `/uploads/${files.bank_passbook[0].filename}` : data.bank_passbook_path;
  const bank_passbook_back_path = files.bank_passbook_back ? `/uploads/${files.bank_passbook_back[0].filename}` : data.bank_passbook_back_path;
  const pan_card_path = files.pan_card ? `/uploads/${files.pan_card[0].filename}` : data.pan_card_path;
  const pan_card_back_path = files.pan_card_back ? `/uploads/${files.pan_card_back[0].filename}` : data.pan_card_back_path;
  const aadhaar_card_path = files.aadhaar_card ? `/uploads/${files.aadhaar_card[0].filename}` : data.aadhaar_card_path;
  const aadhaar_card_back_path = files.aadhaar_card_back ? `/uploads/${files.aadhaar_card_back[0].filename}` : data.aadhaar_card_back_path;
  const educational_certificate_path = files.educational_certificate ? `/uploads/${files.educational_certificate[0].filename}` : data.educational_certificate_path;
  const educational_certificate_back_path = files.educational_certificate_back ? `/uploads/${files.educational_certificate_back[0].filename}` : data.educational_certificate_back_path;
  const resume_path = files.resume ? `/uploads/${files.resume[0].filename}` : data.resume_path;

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
      bank_passbook_path=?, pan_card_path=?, aadhaar_card_path=?, educational_certificate_path=?, signature_name=?, background_verification=?,
      lifecycle_steps=?, official_joining_date=?, father_name=?, mother_name=?, father_mobile=?, mother_mobile=?, wedding_date=?,
      bank_passbook_back_path=?, pan_card_back_path=?, aadhaar_card_back_path=?, educational_certificate_back_path=?, resume_path=?
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
    typeof data.previous_employment === 'object' ? JSON.stringify(data.previous_employment) : data.previous_employment,
    data.office_sim, data.office_sim_date, data.laptop_system,
    data.laptop_system_date, data.official_email_crm, data.official_email_crm_date,
    data.asset_crm, data.asset_peopledesk, data.asset_projects, data.asset_id_card, data.asset_official_mail, data.asset_offer_letter,
    data.check_sim || 0, data.check_laptop || 0, data.check_crm || 0, data.check_peopledesk || 0, data.check_projects || 0, data.check_id_card || 0, data.check_official_mail || 0, data.check_offer_letter || 0,
    bank_passbook_path, pan_card_path, aadhaar_card_path, educational_certificate_path, data.signature_name,
    typeof data.background_verification === 'object' ? JSON.stringify(data.background_verification) : data.background_verification,
    typeof data.lifecycle_steps === 'object' ? JSON.stringify(data.lifecycle_steps) : data.lifecycle_steps,
    data.official_joining_date,
    data.father_name, data.mother_name, data.father_mobile, data.mother_mobile, data.wedding_date,
    bank_passbook_back_path, pan_card_back_path, aadhaar_card_back_path, educational_certificate_back_path, resume_path,
    employeeId
  ];

  return { query, params };
};

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
  const bank_passbook_back_path = files.bank_passbook_back ? `/uploads/${files.bank_passbook_back[0].filename}` : null;
  const pan_card_path = files.pan_card ? `/uploads/${files.pan_card[0].filename}` : null;
  const pan_card_back_path = files.pan_card_back ? `/uploads/${files.pan_card_back[0].filename}` : null;
  const aadhaar_card_path = files.aadhaar_card ? `/uploads/${files.aadhaar_card[0].filename}` : null;
  const aadhaar_card_back_path = files.aadhaar_card_back ? `/uploads/${files.aadhaar_card_back[0].filename}` : null;
  const educational_certificate_path = files.educational_certificate ? `/uploads/${files.educational_certificate[0].filename}` : null;
  const educational_certificate_back_path = files.educational_certificate_back ? `/uploads/${files.educational_certificate_back[0].filename}` : null;
  const resume_path = files.resume ? `/uploads/${files.resume[0].filename}` : null;

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
      bank_passbook_path, pan_card_path, aadhaar_card_path, educational_certificate_path, signature_name, background_verification,
      lifecycle_steps, official_joining_date, father_name, mother_name, father_mobile, mother_mobile, wedding_date,
      bank_passbook_back_path, pan_card_back_path, aadhaar_card_back_path, educational_certificate_back_path, resume_path
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const params = [
    data.status || 'Onboard', file_no, data.full_name, data.father_mother_name, data.dob, data.gender, data.contact_number, data.blood_group,
    data.personal_email, data.marital_status, data.present_address, data.permanent_address, photo_path,
    data.employee_id, data.department, data.designation, data.date_of_joining, data.work_location, data.reporting_manager,
    data.pan_number, data.aadhaar_number, data.other_id,
    data.emergency_contact_name, data.emergency_contact_relationship, data.emergency_contact_number,
    data.father_husband_number, data.mother_wife_number, data.alternate_number,
    data.account_holder_name, data.account_number, data.bank_name, data.ifsc_code, data.branch,
    data.documents_submitted, data.education_qualification, data.year_of_passing, data.institute,
    typeof data.previous_employment === 'object' ? JSON.stringify(data.previous_employment) : data.previous_employment,
    data.office_sim, data.office_sim_date, data.laptop_system, data.laptop_system_date, data.official_email_crm, data.official_email_crm_date,
    data.asset_crm, data.asset_peopledesk, data.asset_projects, data.asset_id_card, data.asset_official_mail, data.asset_offer_letter,
    data.check_sim || 0, data.check_laptop || 0, data.check_crm || 0, data.check_peopledesk || 0, data.check_projects || 0, data.check_id_card || 0, data.check_official_mail || 0, data.check_offer_letter || 0,
    bank_passbook_path, pan_card_path, aadhaar_card_path, educational_certificate_path, data.signature_name,
    typeof data.background_verification === 'object' ? JSON.stringify(data.background_verification) : data.background_verification,
    typeof data.lifecycle_steps === 'object' ? JSON.stringify(data.lifecycle_steps) : data.lifecycle_steps,
    data.official_joining_date,
    data.father_name, data.mother_name, data.father_mobile, data.mother_mobile, data.wedding_date,
    bank_passbook_back_path, pan_card_back_path, aadhaar_card_back_path, educational_certificate_back_path, resume_path
  ];

  if (data.onboarding_token) {
    // Single-use link flow
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.get('SELECT id FROM invitations WHERE token = ? AND status = "pending" AND (type IS NULL OR type = "onboarding")', [data.onboarding_token], (err, row) => {
        if (err || !row) {
          db.run('ROLLBACK');
          return res.status(403).json({ error: 'Invalid or already used invitation token.' });
        }

        db.run(query, params, function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          const employeeId = this.lastID;
          db.run('UPDATE invitations SET status = "used", used_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to consume invitation.' });
            }

            db.run('COMMIT', (err) => {
              if (err) return res.status(500).json({ error: 'Finalizing record failed.' });
              sendOnboardingEmail({ ...data, id: employeeId });
              res.json({ id: employeeId, message: 'Onboarding completed successfully' });
            });
          });
        });
      });
    });
  } else {
    // Normal Admin direct creation
    db.run(query, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      sendOnboardingEmail({ ...data, id: this.lastID });
      res.json({ id: this.lastID, ...data, photo_path });
    });
  }
});

app.post('/api/employees/bulk', async (req, res) => {
  const { employees } = req.body;
  if (!employees || !Array.isArray(employees)) {
    return res.status(400).json({ error: 'Invalid data format.' });
  }

  // Filter out completely empty or near-empty rows (e.g., from XLSX extra rows)
  const filteredEmployees = employees.filter(emp => {
    const keys = Object.keys(emp).filter(k => emp[k] !== null && emp[k] !== undefined && emp[k] !== '');
    return keys.length > 0;
  });

  if (filteredEmployees.length === 0) {
    return res.json({ message: 'No valid data to import.', total: employees.length, success: 0, errors: 0 });
  }

  let successCount = 0;
  let errorMessages = [];

  // Get current max file_no sequence
  const getNextFileNo = async () => {
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
    return nextNum;
  };

  let nextNum = await getNextFileNo();

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
    "signature_name", "background_verification", "lifecycle_steps", "official_joining_date",
    "father_name", "mother_name", "father_mobile", "mother_mobile", "wedding_date",
    "bank_passbook_back_path", "pan_card_back_path", "aadhaar_card_back_path", "educational_certificate_back_path", "resume_path"
  ];

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let processed = 0;
    filteredEmployees.forEach(emp => {
      // Auto-generate file_no if missing
      if (!emp.file_no || emp.file_no === '') {
        emp.file_no = `HRM/26/${String(nextNum++).padStart(3, '0')}`;
      }

      // Default status to 'New' if missing
      if (!emp.status || emp.status === '') {
        emp.status = 'New';
      }

      const keys = Object.keys(emp).filter(k => validKeys.includes(k));
      if (keys.length === 0) {
        processed++;
        if (processed === filteredEmployees.length) finish();
        return;
      }

      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => {
        const val = emp[k];
        if (val === undefined || val === '') return null;
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      });

      const query = `INSERT INTO employees (${keys.join(',')}) VALUES (${placeholders})`;
      db.run(query, values, function (err) {
        if (err) {
          console.error('Bulk Insert Error:', err.message);
          errorMessages.push(`Row ${processed + 1}: ${err.message}`);
        } else {
          successCount++;
        }
        processed++;
        if (processed === filteredEmployees.length) finish();
      });
    });

    function finish() {
      db.run('COMMIT', (err) => {
        if (err) return res.status(500).json({ error: 'Transaction commit failed: ' + err.message });
        res.json({
          message: 'Bulk import completed',
          total: filteredEmployees.length,
          success: successCount,
          errors: errorMessages.length,
          errorDetails: errorMessages.slice(0, 5) // Send first 5 errors for debugging
        });
      });
    }
  });
});

app.put('/api/employees/:id', upload, (req, res) => {
  const data = req.body;
  const files = req.files || {};
  const { query, params } = buildEmployeeUpdate(data, files, req.params.id);

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Employee updated successfully' });
  });
});

app.patch('/api/employees/:id', (req, res) => {
  const data = req.body;
  const fields = Object.keys(data);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const sets = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => {
    const val = data[field];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val;
  });
  values.push(req.params.id);

  const query = `UPDATE employees SET ${sets} WHERE id = ?`;
  db.run(query, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Employee updated successfully' });
  });
});

app.delete('/api/employees/:id', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Employee deleted successfully' });
  });
});

// Resource Bucket API
app.get('/api/bucket', (req, res) => {
  const query = `
    SELECT b.*, e.full_name as assigned_to_name 
    FROM resource_bucket b 
    LEFT JOIN employees e ON b.assigned_to = e.id
    ORDER BY b.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/bucket', (req, res) => {
  const { type, value } = req.body;
  if (!type || !value) {
    return res.status(400).json({ error: 'Type and Value are required' });
  }

  const cleanType = String(type).trim();
  const cleanValue = String(value).trim();

  if (!['Email', 'Phone'].includes(cleanType)) {
    return res.status(400).json({ error: 'Type must be Email or Phone' });
  }

  if (cleanValue.length === 0) {
    return res.status(400).json({ error: 'Value cannot be empty' });
  }

  db.get('SELECT id, type, value, status FROM resource_bucket WHERE LOWER(value) = LOWER(?)', [cleanValue], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) {
      return res.status(400).json({ error: `This ${cleanType.toLowerCase()} (${cleanValue}) already exists in the Resource Bucket.` });
    }

    const stmt = db.prepare('INSERT INTO resource_bucket (type, value, status) VALUES (?, ?, "Available")');
    stmt.run(cleanType, cleanValue, function (insertErr) {
      if (insertErr) return res.status(500).json({ error: insertErr.message });
      res.status(201).json({
        message: `${cleanType} added successfully`,
        resource: {
          id: this.lastID,
          type: cleanType,
          value: cleanValue,
          status: 'Available',
          assigned_to: null,
          assigned_date: null
        }
      });
    });
    stmt.finalize();
  });
});

app.post('/api/bucket/bulk', (req, res) => {
  const services = req.body; // Array of { type, value }
  if (!Array.isArray(services)) return res.status(400).json({ error: 'Data must be an array' });

  const stmt = db.prepare('INSERT OR IGNORE INTO resource_bucket (type, value) VALUES (?, ?)');
  services.forEach(item => {
    stmt.run(item.type, item.value);
  });
  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Resources imported successfully' });
  });
});

app.patch('/api/bucket/:id/assign', (req, res) => {
  const { assigned_to } = req.body;
  if (!assigned_to) return res.status(400).json({ error: 'assigned_to is required' });

  const date = new Date().toISOString().split('T')[0];
  const query = 'UPDATE resource_bucket SET assigned_to = ?, status = "Assigned", assigned_date = ? WHERE id = ?';
  db.run(query, [assigned_to, date, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Resource assigned successfully' });
  });
});

app.patch('/api/bucket/:id/unassign', (req, res) => {
  const query = 'UPDATE resource_bucket SET assigned_to = NULL, status = "Available", assigned_date = NULL WHERE id = ?';
  db.run(query, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Resource unassigned successfully' });
  });
});

app.delete('/api/bucket/:id', (req, res) => {
  db.run('DELETE FROM resource_bucket WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Resource deleted successfully' });
  });
});

// Invitation APIs
app.post('/api/invitations', (req, res) => {
  const { shared_name } = req.body;
  const token = crypto.randomBytes(32).toString('hex');

  db.run('INSERT INTO invitations (token, shared_name, type) VALUES (?, ?, "onboarding")', [token, shared_name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ token, shared_name });
  });
});

app.post('/api/employees/:id/edit-invitations', (req, res) => {
  db.get('SELECT id, full_name FROM employees WHERE id = ?', [req.params.id], (err, employee) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const sharedName = req.body.shared_name || employee.full_name;

    db.run(
      'INSERT INTO invitations (token, shared_name, type, employee_id) VALUES (?, ?, "employee_edit", ?)',
      [token, sharedName, employee.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ token, shared_name: sharedName, employee_id: employee.id });
      }
    );
  });
});

app.post('/api/employees/batch-edit-tokens', (req, res) => {
  const { employee_ids } = req.body;
  if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
    return res.json({ tokens: {}, statuses: {} });
  }

  const ids = Array.from(new Set(employee_ids.map(Number).filter(Boolean)));
  if (ids.length === 0) {
    return res.json({ tokens: {}, statuses: {} });
  }

  const placeholders = ids.map(() => '?').join(',');

  // 1. Fetch any existing pending invitations for these employees
  db.all(
    `SELECT id, employee_id, token, status FROM invitations 
     WHERE employee_id IN (${placeholders}) AND type = "employee_edit" AND status = "pending"
     ORDER BY id ASC`,
    ids,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const tokenMap = {};
      const statusMap = {};
      const existingEmployeeIds = new Set();

      (rows || []).forEach((row) => {
        tokenMap[row.employee_id] = row.token;
        statusMap[row.employee_id] = row.status || 'pending';
        existingEmployeeIds.add(Number(row.employee_id));
      });

      const missingIds = ids.filter((id) => !existingEmployeeIds.has(id));

      if (missingIds.length === 0) {
        return res.json({ tokens: tokenMap, statuses: statusMap });
      }

      // 2. Fetch employee names for missingIds to populate shared_name
      const missingPlaceholders = missingIds.map(() => '?').join(',');
      db.all(
        `SELECT id, full_name FROM employees WHERE id IN (${missingPlaceholders})`,
        missingIds,
        (err, empRows) => {
          if (err) return res.status(500).json({ error: err.message });

          const empNameMap = {};
          (empRows || []).forEach((emp) => {
            empNameMap[emp.id] = emp.full_name;
          });

          db.serialize(() => {
            const stmt = db.prepare(
              'INSERT INTO invitations (token, shared_name, type, employee_id, status) VALUES (?, ?, "employee_edit", ?, "pending")'
            );

            missingIds.forEach((empId) => {
              const token = crypto.randomBytes(32).toString('hex');
              const sharedName = empNameMap[empId] || `Employee #${empId}`;
              stmt.run(token, sharedName, empId);
              tokenMap[empId] = token;
              statusMap[empId] = 'pending';
            });

            stmt.finalize((err) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ tokens: tokenMap, statuses: statusMap });
            });
          });
        }
      );
    }
  );
});

app.get('/api/invitations/verify/:token', (req, res) => {
  db.get('SELECT * FROM invitations WHERE token = ? AND status = "pending" AND (type IS NULL OR type = "onboarding")', [req.params.token], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Invalid or already used invitation' });
    res.json(row);
  });
});

app.get('/api/employee-edit-invitations/verify/:token', (req, res) => {
  const query = `
    SELECT invitations.id AS invitation_id, invitations.shared_name, invitations.status AS invitation_status,
           invitations.created_at AS invitation_created_at, employees.*
    FROM invitations
    JOIN employees ON employees.id = invitations.employee_id
    WHERE invitations.token = ?
      AND invitations.status = "pending"
      AND invitations.type = "employee_edit"
  `;

  db.get(query, [req.params.token], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Invalid or already used employee edit link' });
    res.json({ employee: row });
  });
});

app.put('/api/employee-edit-invitations/:token', upload, (req, res) => {
  const data = req.body;
  const files = req.files || {};

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get(
      'SELECT id, employee_id FROM invitations WHERE token = ? AND status = "pending" AND type = "employee_edit"',
      [req.params.token],
      (err, invitation) => {
        if (err || !invitation) {
          db.run('ROLLBACK');
          return res.status(403).json({ error: 'Invalid or already used employee edit link.' });
        }

        const { query, params } = buildEmployeeUpdate(data, files, invitation.employee_id);

        db.run(query, params, function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          db.run('UPDATE invitations SET status = "used", used_at = CURRENT_TIMESTAMP WHERE id = ?', [invitation.id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to consume employee edit link.' });
            }

            db.get('SELECT * FROM employees WHERE id = ?', [invitation.employee_id], (err, employee) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }

              db.run('COMMIT', (err) => {
                if (err) return res.status(500).json({ error: 'Finalizing employee update failed.' });
                res.json({ message: 'Employee details updated successfully', employee });
              });
            });
          });
        });
      }
    );
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  scheduleNightlyBackup();
});
