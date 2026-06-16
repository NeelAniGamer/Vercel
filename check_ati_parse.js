const fs=require('fs');
const c=fs.readFileSync('ati.html','utf8');

// Check script tags
let count = 0;
c.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (m, i) => {
    count++;
    for(let j=0; j<i.length; j++) {
        if(i.charCodeAt(j) > 127) {
            console.log('Script', count, 'Unicode char at', j, ':', i.charCodeAt(j), 'context:', i.substring(Math.max(0,j-10), Math.min(i.length,j+10)));
        }
    }
});

// Check HTML attributes
const rx = /on[a-z]+=\"([^\"]*)\"/gi;
let m;
while((m = rx.exec(c)) !== null) {
    for(let j=0; j<m[1].length; j++) {
        if(m[1].charCodeAt(j) > 127) {
            console.log('Attribute Unicode char at', j, ':', m[1].charCodeAt(j), 'context:', m[1]);
        }
    }
}

// Try parsing each script block to see which one throws
const vm = require('vm');
count = 0;
c.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, inner) => {
    count++;
    try {
        new vm.Script(inner);
    } catch (e) {
        console.log(`Script ${count} parsing error: ${e.message}`);
        console.log("Snippet:", inner.substring(0, 100));
    }
});
