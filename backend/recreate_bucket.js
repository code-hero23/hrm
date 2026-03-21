const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'c:/Users/aravi/Desktop/master-employee-database/backend/data/database.sqlite';
const db = new sqlite3.Database(dbPath);

console.log('--- RESETTING RESOURCE BUCKET ---');

db.serialize(() => {
  console.log('Dropping old table...');
  db.run("DROP TABLE IF EXISTS resource_bucket");

  console.log('Creating fresh table...');
  db.run(`
    CREATE TABLE resource_bucket (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'Available',
      assigned_to INTEGER,
      assigned_date TEXT,
      FOREIGN KEY(assigned_to) REFERENCES employees(id)
    )
  `, (err) => {
    if (err) {
      console.error('ERROR RECREATING TABLE:', err.message);
    } else {
      console.log('Table "resource_bucket" recreated successfully!');
    }
    db.close();
  });
});
