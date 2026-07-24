const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === 'dist' || file === '.agents' || file === '.git' || file === 'Traffic/Cyberpunk') return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walkDir('C:/Users/neelg/OneDrive/Desktop/Vercel');
const regex = /\.from\(['\"]([a-zA-Z0-9_]+)['\"]\)\s*\.\s*(?:upsert|insert|update|select)\s*\(([\s\S]*?)\)/g;

let tables = {};

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        const table = match[1];
        const args = match[2];
        if (!tables[table]) tables[table] = { select: new Set(), update: new Set() };
        if (args.includes('{')) {
            // It's likely an object for insert/upsert/update
            const objContent = args.substring(args.indexOf('{') + 1, args.lastIndexOf('}'));
            const keys = objContent.split(',').map(s => s.trim().split(':')[0].replace(/['\"]/g, '').trim()).filter(Boolean);
            keys.forEach(k => {
                if (k && !k.includes('...') && !k.includes(' ') && !k.includes('(')) tables[table].update.add(k);
            });
        } else if (args.includes('\'') || args.includes('\"')) {
            // It's likely a select string
            const selContent = args.replace(/['\"]/g, '');
            selContent.split(',').forEach(c => {
               let col = c.trim();
               if(col.includes('(')) col = col.substring(0, col.indexOf('(')); // Handle inner joins
               if(col && col !== '*') tables[table].select.add(col);
            });
        }
    }
});

for (let table in tables) {
    console.log('--- ' + table + ' ---');
    console.log('Update/Insert Keys:', Array.from(tables[table].update));
    console.log('Select Keys:', Array.from(tables[table].select));
}
