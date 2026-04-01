const db = require('./backend/db');

// Simulation of bulk import logic at DB level
function verifyBackendLogic() {
    console.log('--- VERIFYING BACKEND SQL LOGIC ---');
    
    const name = 'SQL Logic Verification User';
    // Logic from backend/index.js lines 277-285 (approx)
    
    // 1. Get next file_no sequence
    db.get("SELECT file_no FROM employees WHERE file_no LIKE 'HRM/26/%' ORDER BY file_no DESC LIMIT 1", (err, row) => {
        let nextNum = 1;
        if (row && row.file_no) {
            const parts = row.file_no.split('/');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        
        const file_no = `HRM/26/${String(nextNum).padStart(3, '0')}`;
        const status = 'New'; // Default in new code
        
        console.log('Generated Data:', { name, file_no, status });
        
        const query = `INSERT INTO employees (full_name, file_no, status) VALUES (?, ?, ?)`;
        db.run(query, [name, file_no, status], function(err) {
            if (err) {
                console.error('Insert failed:', err.message);
                process.exit(1);
            }
            
            console.log('Insert successful, ID:', this.lastID);
            
            // Check record
            db.get("SELECT * FROM employees WHERE id = ?", [this.lastID], (err, row) => {
                if (row) {
                    console.log('Record verified in DB:', row);
                    if (row.status === 'New' && row.file_no.startsWith('HRM/26/')) {
                        console.log('VERIFICATION PASSED');
                    } else {
                        console.error('VERIFICATION FAILED: logic incorrect');
                    }
                } else {
                    console.error('VERIFICATION FAILED: record not found');
                }
                process.exit(0);
            });
        });
    });
}

verifyBackendLogic();
