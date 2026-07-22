const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'academy-figma-import.csv');
const rows = fs.readFileSync(csvPath, 'utf8').split('\n');

const newRows = [];
for (let i = 0; i < rows.length; i++) {
  if (i === 0) {
    newRows.push('Slug,' + rows[i]);
  } else if (rows[i].startsWith('--- BADGES ---')) {
    newRows.push(',' + rows[i]);
  } else if (rows[i].trim() === '') {
    continue;
  } else {
    const cols = rows[i].split(',');
    const title = cols[0];
    const id = cols[1];
    
    let slug = '';
    if (title.includes('Badge') || id.includes('_')) {
      slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    } else {
      slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    newRows.push(slug + ',' + rows[i]);
  }
}

fs.writeFileSync(csvPath, newRows.join('\n'));
console.log('Slug column added to CSV');
