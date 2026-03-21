const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'c:/Users/aravi/Desktop/master-employee-database/backend/data/database.sqlite';
const db = new sqlite3.Database(dbPath);

console.log('Checking database at:', dbPath);

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error('Error listing tables:', err);
    } else {
      console.log('Tables found:', rows.map(r => r.name).join(', '));
    }
  });

  db.all("PRAGMA table_info(resource_bucket)", (err, rows) => {
    if (err) {
      console.error('Error checking resource_bucket:', err);
    } else if (rows.length === 0) {
      console.log('Table "resource_bucket" DOES NOT EXIST.');
    } else {
      console.log('Table "resource_bucket" exists with columns:', rows.map(r => r.name).join(', '));
    }
    db.close();
  });
});
