const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(f => !f.endsWith('-shm') && !f.endsWith('-wal'));

const searchTerm = process.argv[2] || 'shiny|angel';
const regex = new RegExp(searchTerm, 'i');

console.log(`Searching for pattern: "${searchTerm}" across all SQLite databases...`);

async function search() {
  for (const file of files) {
    await new Promise((resolve) => {
      const filePath = path.join(dataDir, file);
      const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) return resolve();
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
          if (err || !tables || tables.length === 0) {
            db.close();
            return resolve();
          }
          let count = tables.length;
          tables.forEach((t) => {
            db.all(`SELECT * FROM ${t.name}`, [], (err, rows) => {
              if (rows) {
                rows.forEach((r) => {
                  const str = JSON.stringify(r);
                  if (regex.test(str)) {
                    console.log(`FOUND in ${file} -> table: ${t.name}`);
                    console.log(JSON.stringify(r, null, 2));
                  }
                });
              }
              count--;
              if (count === 0) {
                db.close();
                resolve();
              }
            });
          });
        });
      });
    });
  }
  console.log('Search finished.');
}

search();
