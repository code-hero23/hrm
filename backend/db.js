const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbPath = path.join(dataDir, 'hrms.sqlite');

// Legacy and fallback candidate paths
const legacyDataDbPath = path.join(dataDir, 'database.sqlite');
const rootDbPath = path.join(__dirname, 'hrms.sqlite');
const legacyRootDbPath = path.join(__dirname, 'database.sqlite');

const getFileSize = (file) => {
  try {
    return fs.existsSync(file) ? fs.statSync(file).size : 0;
  } catch (e) {
    return 0;
  }
};

const currentDbSize = getFileSize(dbPath);
const legacyDataDbSize = getFileSize(legacyDataDbPath);
const rootDbSize = getFileSize(rootDbPath);
const legacyRootDbSize = getFileSize(legacyRootDbPath);

console.log('--- DATABASE DIAGNOSTICS & RECOVERY ---');
console.log(`Active DB Path (${dbPath}): ${currentDbSize} bytes`);
console.log(`Legacy Data DB (${legacyDataDbPath}): ${legacyDataDbSize} bytes`);
console.log(`Root DB (${rootDbPath}): ${rootDbSize} bytes`);
console.log(`Legacy Root DB (${legacyRootDbPath}): ${legacyRootDbSize} bytes`);

// Auto-Recovery 1: If active hrms.sqlite has no data or legacy database.sqlite exists in data folder
if (legacyDataDbSize > 8192 && fs.existsSync(legacyDataDbPath)) {
  console.log('>>> RECOVERY: Found legacy database.sqlite with existing data! Checking migration...');
  try {
    // Check if current hrms.sqlite is missing or same size/smaller
    if (!fs.existsSync(dbPath) || legacyDataDbSize >= currentDbSize) {
      if (currentDbSize > 0 && fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, dbPath + '.bak_' + Date.now());
      }
      fs.copyFileSync(legacyDataDbPath, dbPath);
      if (fs.existsSync(legacyDataDbPath + '-wal')) {
        fs.copyFileSync(legacyDataDbPath + '-wal', dbPath + '-wal');
      }
      if (fs.existsSync(legacyDataDbPath + '-shm')) {
        fs.copyFileSync(legacyDataDbPath + '-shm', dbPath + '-shm');
      }
      console.log('>>> RECOVERY: Migration from legacy database.sqlite & WAL files successful!');
    }
  } catch (e) {
    console.error('>>> RECOVERY ERROR:', e.message);
  }
}
// Auto-Recovery 2: Root database.sqlite fallback
else if (legacyRootDbSize > 8192 && fs.existsSync(legacyRootDbPath)) {
  console.log('>>> RECOVERY: Found root database.sqlite with existing data! Migrating to data/hrms.sqlite...');
  try {
    if (currentDbSize > 0 && fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, dbPath + '.bak_' + Date.now());
    }
    fs.copyFileSync(legacyRootDbPath, dbPath);
    console.log('>>> RECOVERY: Migration from root database.sqlite successful!');
  } catch (e) {
    console.error('>>> RECOVERY ERROR:', e.message);
  }
}
// Auto-Recovery 3: Root hrms.sqlite fallback
else if (rootDbSize > 8192 && fs.existsSync(rootDbPath)) {
  console.log('>>> RECOVERY: Found root hrms.sqlite with existing data! Migrating to data/hrms.sqlite...');
  try {
    if (currentDbSize > 0 && fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, dbPath + '.bak_' + Date.now());
    }
    fs.copyFileSync(rootDbPath, dbPath);
    console.log('>>> RECOVERY: Migration from root hrms.sqlite successful!');
  } catch (e) {
    console.error('>>> RECOVERY ERROR:', e.message);
  }
}


const db = new sqlite3.Database(dbPath);
db.configure('busyTimeout', 10000);

db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA busy_timeout = 10000');

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
      type TEXT DEFAULT 'onboarding',
      employee_id INTEGER,
      status TEXT DEFAULT 'pending', -- 'pending' or 'used'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME
    )
  `);

  db.run("ALTER TABLE invitations ADD COLUMN type TEXT DEFAULT 'onboarding'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding invitation column type:', err.message);
    }
  });

  db.run("ALTER TABLE invitations ADD COLUMN employee_id INTEGER", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding invitation column employee_id:', err.message);
    }
  });

  db.run("ALTER TABLE invitations ADD COLUMN used_at DATETIME", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding invitation column used_at:', err.message);
    }
  });

  // Insert default admin if not exists (username: Admin@cookscape.com, password: Hrmaster@2026)
  const hashedAdminPassword = bcrypt.hashSync('Hrmaster@2026', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('Admin@cookscape.com', '${hashedAdminPassword}', 'admin')`);

  // Insert default viewer if not exists (username: View@cookscape.com, password: View@2026)
  const hashedViewerPassword = bcrypt.hashSync('View@2026', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('View@cookscape.com', '${hashedViewerPassword}', 'viewer')`);

  // Insert admin@cookscape.com if not exists or replace to update password
  const hashedUserAdminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR REPLACE INTO users (username, password, role) VALUES ('admin@cookscape.com', '${hashedUserAdminPassword}', 'admin')`);

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
