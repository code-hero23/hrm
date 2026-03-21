const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'c:/Users/aravi/Desktop/master-employee-database/backend/data/database.sqlite';
const db = new sqlite3.Database(dbPath);

console.log('Final Validation of API Query...');

const query = `
  SELECT b.*, e.full_name as assigned_to_name 
  FROM resource_bucket b 
  LEFT JOIN employees e ON b.assigned_to = e.id
  ORDER BY b.id DESC
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('FAILED:', err.message);
  } else {
    console.log('SUCCESS: Query returned', rows.length, 'rows.');
  }
  db.close();
});
