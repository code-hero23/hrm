const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const bcrypt = require('bcrypt');
const readline = require('readline');

// Ensure data folder exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Find the active database file
let dbPath = path.join(dataDir, 'hrms.sqlite');
if (!fs.existsSync(dbPath)) {
  const legacyData = path.join(dataDir, 'database.sqlite');
  const rootHrms = path.join(__dirname, 'hrms.sqlite');
  const rootDb = path.join(__dirname, 'database.sqlite');
  if (fs.existsSync(legacyData)) dbPath = legacyData;
  else if (fs.existsSync(rootHrms)) dbPath = rootHrms;
  else if (fs.existsSync(rootDb)) dbPath = rootDb;
}

// Check if sqlite3 native module is available
let sqlite3Module = null;
try {
  sqlite3Module = require('sqlite3').verbose();
} catch (e) {
  // Fall back to sqlite3 CLI
}

// Database helper functions supporting both native module and sqlite3 CLI
function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sqlite3Module) {
      const db = new sqlite3Module.Database(dbPath);
      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows || []);
      });
    } else {
      try {
        let formattedSql = sql;
        params.forEach(p => {
          const val = typeof p === 'string' ? `'${p.replace(/'/g, "''")}'` : (p === null ? 'NULL' : p);
          formattedSql = formattedSql.replace('?', val);
        });
        const output = execSync(`sqlite3 "${dbPath}" -header -csv`, { input: formattedSql, encoding: 'utf8' }).trim();
        if (!output) return resolve([]);
        const lines = output.split(/\r?\n/);
        const headers = lines[0].split(',');
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',');
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = vals[idx]; });
          return obj;
        });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    }
  });
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sqlite3Module) {
      const db = new sqlite3Module.Database(dbPath);
      db.run(sql, params, function(err) {
        db.close();
        if (err) reject(err);
        else resolve({ changes: this ? this.changes : 1 });
      });
    } else {
      try {
        let formattedSql = sql;
        params.forEach(p => {
          const val = typeof p === 'string' ? `'${p.replace(/'/g, "''")}'` : (p === null ? 'NULL' : p);
          formattedSql = formattedSql.replace('?', val);
        });
        execSync(`sqlite3 "${dbPath}"`, { input: formattedSql, encoding: 'utf8' });
        resolve({ changes: 1 });
      } catch (err) {
        reject(err);
      }
    }
  });
}

async function ensureTable() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'admin'
    )
  `);
}

async function listUsers() {
  await ensureTable();
  const users = await queryAll('SELECT id, username, role FROM users');
  return users;
}

async function resetOrAddUser(username, plainPassword, role) {
  await ensureTable();
  const cleanUsername = username.trim();
  const cleanPassword = plainPassword.trim();
  const cleanRole = role ? role.trim() : null;

  if (!cleanUsername || !cleanPassword) {
    throw new Error('Both username and password are required.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(cleanPassword, salt);

  const existing = await queryAll('SELECT * FROM users WHERE username = ?', [cleanUsername]);

  if (existing.length > 0) {
    if (cleanRole) {
      await runSql('UPDATE users SET password = ?, role = ? WHERE username = ?', [hashedPassword, cleanRole, cleanUsername]);
    } else {
      await runSql('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, cleanUsername]);
    }
    return { status: 'updated', username: cleanUsername, role: cleanRole || existing[0].role };
  } else {
    const finalRole = cleanRole || 'admin';
    await runSql('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [cleanUsername, hashedPassword, finalRole]);
    return { status: 'created', username: cleanUsername, role: finalRole };
  }
}

async function main() {
  const [,, argUser, argPass, argRole] = process.argv;

  console.log('\n======================================================');
  console.log('       Cookscape HRM - Password Reset Utility         ');
  console.log('======================================================');
  console.log(`Database: ${dbPath}\n`);

  if (argUser && argPass) {
    try {
      console.log(`Processing user: ${argUser}...`);
      const result = await resetOrAddUser(argUser, argPass, argRole);
      if (result.status === 'updated') {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m Password updated successfully for existing user: ${result.username} (Role: ${result.role})`);
      } else {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m User created successfully: ${result.username} (Role: ${result.role})`);
      }
    } catch (err) {
      console.error('\x1b[31m[ERROR]\x1b[0m', err.message);
    }
    process.exit(0);
  }

  // If no arguments, show existing users and interactive prompt
  try {
    const users = await listUsers();
    console.log('Current Registered Users:');
    if (users.length === 0) {
      console.log('  (No users found in database)');
    } else {
      console.table(users);
    }
  } catch (e) {
    console.log('Could not list users:', e.message);
  }

  console.log('\n--- Usage via Command Line ---');
  console.log('  node reset_password.js <username> <new_password> [role]');
  console.log('Examples:');
  console.log('  node reset_password.js admin@cookscape.com Admin@2026');
  console.log('  node reset_password.js Admin@cookscape.com Hrmaster@2026 admin');
  console.log('  node reset_password.js View@cookscape.com View@2026 viewer\n');

  if (!process.stdin.isTTY) {
    process.exit(0);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter Username / Email to reset/add (or press Enter to exit): ', (inputUser) => {
    if (!inputUser || !inputUser.trim()) {
      console.log('Exiting.');
      rl.close();
      return;
    }

    rl.question('Enter New Password: ', (inputPass) => {
      if (!inputPass || !inputPass.trim()) {
        console.log('Password cannot be empty. Exiting.');
        rl.close();
        return;
      }

      rl.question('Enter Role [admin/viewer] (default: keep existing or admin): ', async (inputRole) => {
        try {
          const result = await resetOrAddUser(inputUser, inputPass, inputRole);
          if (result.status === 'updated') {
            console.log(`\n\x1b[32m[SUCCESS]\x1b[0m Password updated successfully for: ${result.username} (Role: ${result.role})`);
          } else {
            console.log(`\n\x1b[32m[SUCCESS]\x1b[0m User created successfully: ${result.username} (Role: ${result.role})`);
          }
        } catch (err) {
          console.error('\n\x1b[31m[ERROR]\x1b[0m', err.message);
        }
        rl.close();
      });
    });
  });
}

main();
