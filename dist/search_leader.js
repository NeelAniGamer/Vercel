const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const regex = /leader.*code|code.*leader/i;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!['.agents', 'dist', 'node_modules', '.git'].includes(file)) {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (file.match(/\.(js|ts|tsx|html)$/) && file !== 'supabase.js') {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk(rootDir);
let found = false;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (regex.test(content)) {
        console.log(`Found in: ${file.replace(rootDir, '')}`);
        found = true;
    }
});

if (!found) {
    console.log("No matches found.");
}
