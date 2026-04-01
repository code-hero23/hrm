import * as XLSX from './frontend/node_modules/xlsx/xlsx.mjs';
import * as fs from 'fs';

XLSX.set_fs(fs);

const csvContent = fs.readFileSync('bulk_import_sample.csv', 'utf8');

// Parse CSV manually
const rows = csvContent.trim().split('\n').map(row => {
  const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
  return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
});

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, "Employees");

XLSX.writeFile(wb, "bulk_import_sample.xlsx");
console.log("Excel file generated: bulk_import_sample.xlsx");
