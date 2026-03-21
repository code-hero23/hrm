const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'c:/Users/aravi/Desktop/master-employee-database/backend/data/database.sqlite';
const db = new sqlite3.Database(dbPath);

console.log('Testing EXACT API query...');

const query = `
  SELECT b.*, e.name as assigned_to_name 
  FROM resource_bucket b 
  LEFT JOIN employees e ON b.assigned_to = e.id
  ORDER BY b.id DESC
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('CRITICAL: API Query Failed!', err.message);
  } else {
    console.log('Query successful! Rows found:', rows.length);
    if (rows.length > 0) console.log('Sample data:', rows[0]);
  }
  db.close();
});
