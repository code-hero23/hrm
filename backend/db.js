const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT DEFAULT 'Onboard', -- Onboard, Working, Resigned
      
      -- Personal Info
      file_no TEXT,
      full_name TEXT,
      father_mother_name TEXT,
      dob TEXT,
      gender TEXT,
      contact_number TEXT,
      blood_group TEXT,
      personal_email TEXT,
      marital_status TEXT,
      present_address TEXT,
      permanent_address TEXT,
      photo_path TEXT,

      -- Employment Details
      employee_id TEXT,
      department TEXT,
      designation TEXT,
      date_of_joining TEXT,
      work_location TEXT,
      reporting_manager TEXT,

      -- Identification
      pan_number TEXT,
      aadhaar_number TEXT,
      other_id TEXT,

      -- Emergency Contact
      emergency_contact_name TEXT,
      emergency_contact_relationship TEXT,
      emergency_contact_number TEXT,
      father_husband_number TEXT,
      mother_wife_number TEXT,
      alternate_number TEXT,

      -- Bank Details
      account_holder_name TEXT,
      account_number TEXT,
      bank_name TEXT,
      ifsc_code TEXT,
      branch TEXT,

      -- Documents Submitted (JSON string)
      documents_submitted TEXT,

      -- Education & Experience (JSON string)
      education_qualification TEXT,
      year_of_passing TEXT,
      institute TEXT,
      previous_employment TEXT, -- JSON array of objects

      -- Office Use
      office_sim TEXT,
      office_sim_date TEXT,
      laptop_system TEXT,
      laptop_system_date TEXT,
      official_email_crm TEXT,
      official_email_crm_date TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Insert default admin if not exists (username: Admin@cookscape.com, password: Hrmaster@2026)
  const hashedPassword = bcrypt.hashSync('Hrmaster@2026', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password) VALUES ('Admin@cookscape.com', '${hashedPassword}')`);

  console.log('Database initialized');
});

module.exports = db;
