const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const regex = /\.rpc\(['"`](.*?)['"`]\)/g;

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
const tables = {};

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        const table = match[1];
        if (!tables[table]) {
            tables[table] = [];
        }
        tables[table].push(file.replace(rootDir, ''));
    }
});

console.log(JSON.stringify(tables, null, 2));
