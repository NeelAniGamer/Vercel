const fs = require('fs');

function checkFile(file) {
    const html = fs.readFileSync(file, 'utf8');
    const scripts = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
    console.log(`\nChecking ${file}... found ${scripts.length} script tags.`);
    
    scripts.forEach((s, i) => {
        const code = s[1].trim();
        if(!code) return;
        try {
            // wrapping in async function to allow await
            new Function(`async function main() { ${code} }`);
            console.log(`Script ${i}: OK`);
        } catch(e) {
            console.error(`Script ${i} Error: ${e.message}`);
            // print exact line of error by writing to temp file and parsing
            fs.writeFileSync('temp.js', code);
            try { require('child_process').execSync('node -c temp.js', {stdio:'inherit'}); } catch(err) {}
        }
    });
}

checkFile('c:/Users/neelg/OneDrive/Desktop/Vercel/qr.html');
checkFile('c:/Users/neelg/OneDrive/Desktop/Vercel/qr-editor.html');
