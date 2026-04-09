const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'backend', 'index.js');
const content = fs.readFileSync(filePath, 'utf8');

// 1. Extract the column list from the INSERT query
const columnMatch = content.match(/INSERT INTO employees \(([\s\S]*?)\) VALUES/);
if (!columnMatch) {
    console.error('Could not find INSERT INTO employees query');
    process.exit(1);
}

const columns = columnMatch[1].split(',').map(c => c.trim()).filter(Boolean);
console.log(`Columns in INSERT list: ${columns.length}`);

// 2. Extract the placeholders from the VALUES list
const valuesMatch = content.match(/VALUES \(([\s\S]*?)\)/);
if (!valuesMatch) {
    console.error('Could not find VALUES list');
    process.exit(1);
}

const placeholders = valuesMatch[1].split(',').map(p => p.trim()).filter(Boolean);
console.log(`Placeholders in VALUES list: ${placeholders.length}`);

// 3. Extract the params array
const paramsStartIndex = content.indexOf('const params = [');
if (paramsStartIndex === -1) {
    console.error('Could not find params array');
    process.exit(1);
}

// Simple heuristic to find the end of the array
let parenCount = 0;
let arrayContent = '';
let foundStart = false;
for (let i = paramsStartIndex; i < content.length; i++) {
    if (content[i] === '[') {
        foundStart = true;
        parenCount++;
        if (parenCount === 1) continue;
    }
    if (content[i] === ']') {
        parenCount--;
        if (foundStart && parenCount === 0) break;
    }
    if (foundStart) arrayContent += content[i];
}

// Minimal split by comma (ignoring commas inside strings or parens for now as simple heuristic)
// Since we know the file structure, we can count the commas in that specific block.
const paramsLength = arrayContent.split(',').length;
console.log(`Estimated params in array: ${paramsLength}`);

if (columns.length === placeholders.length) {
    console.log('--- SUCCESS: Column count matches Placeholder count ---');
    console.log(`Total: ${columns.length}`);
} else {
    console.error('--- FAILURE: Mismatch detected! ---');
    console.error(`Columns: ${columns.length}`);
    console.error(`Placeholders: ${placeholders.length}`);
}
