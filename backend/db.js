const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbPath = path.join(dataDir, 'database.sqlite');
const rootDbPath = path.join(__dirname, 'database.sqlite');

// Diagnostics and Aggressive Recovery Logic
const rootDbExists = fs.existsSync(rootDbPath);
const dataDbExists = fs.existsSync(dbPath);

console.log('--- DATABASE DIAGNOSTICS ---');
console.log('Root DB Path:', rootDbPath, '| Exists:', rootDbExists);
console.log('Data DB Path:', dbPath, '| Exists:', dataDbExists);

// We use a separate connection for diagnostics to avoid locking the main one
if (rootDbExists) {
    try {
        const rootSize = fs.statSync(rootDbPath).size;
        console.log(`Root DB File Size: ${rootSize} bytes`);

        // Aggressive Migration: If root database is found, we assume it's the one with data
        // especially if it's typical SQLite size (usually >= 20480 for a few records)
        if (rootSize > 0) {
            const dataSize = dataDbExists ? fs.statSync(dbPath).size : 0;
            
            // If Data DB is significantly smaller (like empty) or missing, MOVE ROOT TO DATA
            if (!dataDbExists || rootSize > dataSize) {
                console.log('!!! RECOVERY: DATA MISMATCH DETECTED !!!');
                console.log(`Root DB (${rootSize}) is likely the correct one. Data DB is ${dataSize}.`);
                console.log('Migrating root data to persistent volume...');
                
                if (dataDbExists) fs.copyFileSync(dbPath, dbPath + '.bak_' + Date.now());
                fs.copyFileSync(rootDbPath, dbPath);
                
                console.log('RECOVERY: Migration successful. Connecting to restored data.');
            }
        }
    } catch (e) {
        console.error('RECOVERY LOGIC ERROR:', e.message);
    }
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT DEFAULT 'Onboard', -- New, Onboard, Working, Trainee, Resigned, etc.
      
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
      official_joining_date TEXT,
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
      
      asset_crm TEXT,
      asset_peopledesk TEXT,
      asset_projects TEXT,
      asset_id_card TEXT,
      asset_official_mail TEXT,
      asset_offer_letter TEXT,
      
      check_sim INTEGER DEFAULT 0,
      check_laptop INTEGER DEFAULT 0,
      check_crm INTEGER DEFAULT 0,
      check_peopledesk INTEGER DEFAULT 0,
      check_projects INTEGER DEFAULT 0,
      check_id_card INTEGER DEFAULT 0,
      check_official_mail INTEGER DEFAULT 0,
      check_offer_letter INTEGER DEFAULT 0,
      
      -- Supporting Documents
      bank_passbook_path TEXT,
      pan_card_path TEXT,
      aadhaar_card_path TEXT,
      educational_certificate_path TEXT,
      signature_name TEXT,
      background_verification TEXT, -- JSON string for verification details
      lifecycle_steps TEXT, -- JSON string for 19-step onboarding workflow

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'admin'
    )
  `);

  // Migration for existing users table
  db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'", (err) => {
    // Ignore error if column already exists
  });
 
  db.run(`
    CREATE TABLE IF NOT EXISTS resource_bucket (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'Available',
      assigned_to INTEGER,
      assigned_date TEXT,
      FOREIGN KEY(assigned_to) REFERENCES employees(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      shared_name TEXT,
      status TEXT DEFAULT 'pending', -- 'pending' or 'used'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default admin if not exists (username: Admin@cookscape.com, password: Hrmaster@2026)
  const hashedAdminPassword = bcrypt.hashSync('Hrmaster@2026', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('Admin@cookscape.com', '${hashedAdminPassword}', 'admin')`);

  // Insert default viewer if not exists (username: View@cookscape.com, password: View@2026)
  const hashedViewerPassword = bcrypt.hashSync('View@2026', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('View@cookscape.com', '${hashedViewerPassword}', 'viewer')`);

  console.log('Database initialized');

  // Evolution: Add missing columns if they don't exist
  const addColumn = (colName, colType) => {
    db.run(`ALTER TABLE employees ADD COLUMN ${colName} ${colType}`, (err) => {
      if (err) {
        if (!err.message.includes('duplicate column name')) {
          console.error(`Error adding column ${colName}:`, err.message);
        }
      } else {
        console.log(`Added column: ${colName}`);
      }
    });
  };

  // List of columns that might be missing in older databases
  const potentialMissingColumns = {
    'signature_name': 'TEXT',
    'background_verification': 'TEXT',
    'marital_status': 'TEXT',
    'personal_email': 'TEXT',
    'bank_passbook_path': 'TEXT',
    'pan_card_path': 'TEXT',
    'aadhaar_card_path': 'TEXT',
    'educational_certificate_path': 'TEXT',
    'check_sim': 'INTEGER DEFAULT 0',
    'check_laptop': 'INTEGER DEFAULT 0',
    'check_crm': 'INTEGER DEFAULT 0',
    'check_peopledesk': 'INTEGER DEFAULT 0',
    'check_projects': 'INTEGER DEFAULT 0',
    'check_id_card': 'INTEGER DEFAULT 0',
    'check_official_mail': 'INTEGER DEFAULT 0',
    'check_offer_letter': 'INTEGER DEFAULT 0',
    'asset_crm': 'TEXT',
    'asset_peopledesk': 'TEXT',
    'asset_projects': 'TEXT',
    'asset_id_card': 'TEXT',
    'asset_official_mail': 'TEXT',
    'asset_offer_letter': 'TEXT',
    'lifecycle_steps': 'TEXT',
    'official_joining_date': 'TEXT',
    'documents_passwords': 'TEXT',
    'father_name': 'TEXT',
    'mother_name': 'TEXT',
    'father_mobile': 'TEXT',
    'mother_mobile': 'TEXT',
    'wedding_date': 'TEXT',
    'bank_passbook_back_path': 'TEXT',
    'pan_card_back_path': 'TEXT',
    'aadhaar_card_back_path': 'TEXT',
    'educational_certificate_back_path': 'TEXT',
    'resume_path': 'TEXT'
  };

  Object.entries(potentialMissingColumns).forEach(([name, type]) => {
    addColumn(name, type);
  });
});

module.exports = db;
