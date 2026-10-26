const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const projectRoot = path.resolve(__dirname, '..');
const backendDir = __dirname;
const dataDir = path.join(backendDir, 'data');
const backupsDir = path.join(backendDir, 'backups');

const activeDbPath = path.join(dataDir, 'hrms.sqlite');

function getFilesRecursively(dir, filterFn) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of list) {
      const fullPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath, filterFn));
      } else if (filterFn(dirent.name, fullPath)) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // Ignore unreadable dirs
  }
  return results;
}

function inspectSqliteFile(filePath) {
  return new Promise((resolve) => {
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (e) {
      return resolve(null);
    }

    if (stat.size < 4096) return resolve(null);

    const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return resolve(null);

      db.get('SELECT COUNT(*) as empCount, MAX(id) as maxId, MAX(created_at) as latestCreated FROM employees', [], (err, empStats) => {
        if (err || !empStats) {
          db.close();
          return resolve(null);
        }

        db.all('SELECT id, full_name, created_at FROM employees ORDER BY id DESC LIMIT 2', [], (err, latestEmps) => {
          db.get('SELECT COUNT(*) as userCount FROM users', [], (err, userStats) => {
            db.close();
            resolve({
              type: 'sqlite',
              filePath,
              relPath: path.relative(projectRoot, filePath),
              size: stat.size,
              mtime: stat.mtime,
              empCount: empStats.empCount || 0,
              maxId: empStats.maxId || 0,
              latestCreated: empStats.latestCreated || 'N/A',
              latestEmployees: (latestEmps || []).map(e => `#${e.id} ${e.full_name}`).join(', '),
              userCount: userStats ? userStats.userCount : 0
            });
          });
        });
      });
    });
  });
}

function inspectJsonFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!content || !Array.isArray(content.employees)) return null;

    const employees = content.employees;
    const maxId = employees.reduce((max, e) => (e.id > max ? e.id : max), 0);
    const latestCreated = employees.reduce((latest, e) => (e.created_at > latest ? e.created_at : latest), '');
    const latestTwo = [...employees].sort((a, b) => b.id - a.id).slice(0, 2);

    return {
      type: 'json',
      filePath,
      relPath: path.relative(projectRoot, filePath),
      size: stat.size,
      mtime: stat.mtime,
      empCount: employees.length,
      maxId,
      latestCreated: latestCreated || 'N/A',
      latestEmployees: latestTwo.map(e => `#${e.id} ${e.full_name}`).join(', '),
      userCount: 'N/A'
    };
  } catch (e) {
    return null;
  }
}

async function findCandidateBackups() {
  const isCandidateName = (name) => {
    return (
      (name.endsWith('.sqlite') || name.includes('.sqlite.bak_') || name.startsWith('hrms.sqlite.bak_')) &&
      !name.endsWith('-wal') &&
      !name.endsWith('-shm')
    );
  };

  const sqliteFiles = [
    ...getFilesRecursively(dataDir, isCandidateName),
    ...getFilesRecursively(backupsDir, isCandidateName),
    ...getFilesRecursively(backendDir, (name, full) => full === path.join(backendDir, 'database.sqlite') || full === path.join(backendDir, 'hrms.sqlite'))
  ];

  const jsonFiles = getFilesRecursively(backupsDir, (name) => name.endsWith('.json') && name.includes('employees-backup-'));

  const candidates = [];
  const visited = new Set();

  for (const f of sqliteFiles) {
    if (visited.has(f)) continue;
    visited.add(f);
    const info = await inspectSqliteFile(f);
    if (info) candidates.push(info);
  }

  for (const f of jsonFiles) {
    if (visited.has(f)) continue;
    visited.add(f);
    const info = inspectJsonFile(f);
    if (info) candidates.push(info);
  }

  // Sort candidates by maxId DESC, latestCreated DESC, empCount DESC, mtime DESC
  candidates.sort((a, b) => {
    if (b.maxId !== a.maxId) return b.maxId - a.maxId;
    if (b.latestCreated !== a.latestCreated) return String(b.latestCreated).localeCompare(String(a.latestCreated));
    if (b.empCount !== a.empCount) return b.empCount - a.empCount;
    return new Date(b.mtime) - new Date(a.mtime);
  });

  return candidates;
}

async function restoreFromCandidate(candidate) {
  console.log(`\n======================================================`);
  console.log(` Restoring database from: ${candidate.relPath}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Safety backup of existing active database
  const safetyBackup = path.join(dataDir, `hrms.sqlite.safety_before_restore_${Date.now()}`);
  if (fs.existsSync(activeDbPath)) {
    console.log(`1. Creating safety backup of active database to: ${path.basename(safetyBackup)}`);
    fs.copyFileSync(activeDbPath, safetyBackup);
    if (fs.existsSync(activeDbPath + '-wal')) {
      fs.copyFileSync(activeDbPath + '-wal', safetyBackup + '-wal');
    }
  }

  // 2. Perform restoration
  if (candidate.type === 'sqlite') {
    console.log(`2. Copying ${candidate.filePath} -> ${activeDbPath}...`);
    fs.copyFileSync(candidate.filePath, activeDbPath);

    const walSrc = candidate.filePath + '-wal';
    const walDst = activeDbPath + '-wal';
    if (fs.existsSync(walSrc)) {
      console.log(`   Copying accompanying WAL file: ${path.basename(walSrc)}`);
      fs.copyFileSync(walSrc, walDst);
    } else if (fs.existsSync(walDst)) {
      try { fs.unlinkSync(walDst); } catch (e) {}
    }

    const shmSrc = candidate.filePath + '-shm';
    const shmDst = activeDbPath + '-shm';
    if (fs.existsSync(shmSrc)) {
      fs.copyFileSync(shmSrc, shmDst);
    } else if (fs.existsSync(shmDst)) {
      try { fs.unlinkSync(shmDst); } catch (e) {}
    }

    // 3. Force checkpoint to merge WAL into main sqlite file cleanly
    await new Promise((resolve) => {
      const db = new sqlite3.Database(activeDbPath, (err) => {
        if (err) return resolve();
        db.run('PRAGMA wal_checkpoint(TRUNCATE)', () => {
          db.close(() => resolve());
        });
      });
    });
  } else if (candidate.type === 'json') {
    console.log(`2. Restoring from JSON backup ${candidate.filePath}...`);
    const content = JSON.parse(fs.readFileSync(candidate.filePath, 'utf8'));
    const employees = content.employees;

    await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(activeDbPath, (err) => {
        if (err) return reject(err);
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          db.run('DELETE FROM employees');
          db.run("DELETE FROM sqlite_sequence WHERE name = 'employees'");

          if (employees.length === 0) {
            db.run('COMMIT', () => { db.close(); resolve(); });
            return;
          }

          const columns = Object.keys(employees[0]).filter(k => k !== 'created_at');
          const placeholders = columns.map(() => '?').join(',');
          const stmt = db.prepare(`INSERT INTO employees (${columns.join(',')}) VALUES (${placeholders})`);

          employees.forEach(emp => {
            const values = columns.map(c => {
              const v = emp[c];
              return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
            });
            stmt.run(values);
          });

          stmt.finalize();
          db.run('COMMIT', (commitErr) => {
            db.close();
            if (commitErr) reject(commitErr);
            else resolve();
          });
        });
      });
    });
  }

  // 4. Archive legacy database.sqlite so it never overwrites again
  const legacyDataDb = path.join(dataDir, 'database.sqlite');
  if (fs.existsSync(legacyDataDb)) {
    const archivePath = path.join(dataDir, `database.sqlite.archived_${Date.now()}`);
    console.log(`3. Archiving legacy database.sqlite -> ${path.basename(archivePath)}`);
    try {
      fs.renameSync(legacyDataDb, archivePath);
    } catch (e) {
      fs.copyFileSync(legacyDataDb, archivePath);
      try { fs.unlinkSync(legacyDataDb); } catch (err) {}
    }
  }

  console.log(`\n\x1b[32m[SUCCESS]\x1b[0m Restoration complete! Active database is now: ${activeDbPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const doRestore = args.includes('--restore');
  const targetFileArg = args.find(a => !a.startsWith('--'));

  console.log('\n======================================================');
  console.log('      PeopleDesk HRM - Live Data Recovery Tool        ');
  console.log('======================================================\n');
  console.log(`Searching for all database backups across:\n - ${dataDir}\n - ${backupsDir}\n`);

  const candidates = await findCandidateBackups();

  if (candidates.length === 0) {
    console.log('No candidate database or backup files found.');
    process.exit(0);
  }

  console.log(`Found ${candidates.length} candidate database / backup snapshots:\n`);

  console.table(candidates.map((c, idx) => ({
    Index: idx + 1,
    Type: c.type.toUpperCase(),
    Employees: c.empCount,
    'Max ID': c.maxId,
    'Latest Created': c.latestCreated,
    'Recent Sample': c.latestEmployees.slice(0, 30),
    'File Path': c.relPath
  })));

  const bestCandidate = candidates[0];
  console.log(`\n\x1b[36m[RECOMMENDED CANDIDATE]\x1b[0m: Index 1`);
  console.log(`Path: ${bestCandidate.filePath}`);
  console.log(`Total Employees: ${bestCandidate.empCount} | Max ID: ${bestCandidate.maxId} | Latest: ${bestCandidate.latestCreated}`);
  console.log(`Sample: ${bestCandidate.latestEmployees}`);

  if (doRestore) {
    let chosenCandidate = bestCandidate;
    if (targetFileArg) {
      const matched = candidates.find(c => c.filePath.includes(targetFileArg) || c.relPath.includes(targetFileArg));
      if (matched) {
        chosenCandidate = matched;
      } else {
        console.error(`Target file argument "${targetFileArg}" did not match any candidate.`);
        process.exit(1);
      }
    }
    await restoreFromCandidate(chosenCandidate);
  } else {
    console.log('\n--- HOW TO RESTORE ---');
    console.log('To automatically restore the recommended candidate, run:');
    console.log('  node recover_live_data.js --restore\n');
    console.log('Or restore a specific backup file by specifying part of its path:');
    console.log('  node recover_live_data.js --restore <backup_filename_or_path>\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
