const axios = require('axios');

async function testBulkImport() {
    console.log('Testing Bulk Import with minimal data...');
    try {
        const response = await axios.post('http://localhost:5018/api/employees/bulk', {
            employees: [
                { "Name": "Test Minimal User" } // Only name provided
            ]
        });
        console.log('Success:', response.data);
        
        // Fetch employees to verify the record
        const getRes = await axios.get('http://localhost:5018/api/employees');
        const user = getRes.data.find(u => u.full_name === 'Test Minimal User');
        
        if (user) {
            console.log('Record found in DB:');
            console.log(' - Name:', user.full_name);
            console.log(' - Status:', user.status);
            console.log(' - File No:', user.file_no);
            
            if (user.status === 'New' && user.file_no.startsWith('HRM/26/')) {
                console.log('VERIFICATION PASSED: Default status is New and File No is auto-generated.');
            } else {
                console.log('VERIFICATION FAILED: Status or File No mismatch.');
            }
        } else {
            console.log('VERIFICATION FAILED: Record not found in DB.');
        }
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testBulkImport();
