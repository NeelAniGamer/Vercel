const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const baseUrl = 'https://advancedlogiclabs.dpdns.org';
let sitemapUrls = [];

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Clean canonicals
    const cleanName = file.replace('.html', '');
    let canonicalUrl = `${baseUrl}/${cleanName}`;
    
    if (file === 'home.html' || file === 'index.html') {
        canonicalUrl = `${baseUrl}/`;
    }
    
    const canonicalRegex = /<link rel="canonical" href="([^"]+)" \/>/g;
    
    if (content.match(canonicalRegex)) {
        content = content.replace(canonicalRegex, `<link rel="canonical" href="${canonicalUrl}" />`);
    } else {
        // Add canonical if missing (insert before </head>)
        content = content.replace('</head>', `\n<link rel="canonical" href="${canonicalUrl}" />\n</head>`);
    }
    
    fs.writeFileSync(path.join(dir, file), content);
    
    // Determine priority
    let priority = '0.8';
    let freq = 'monthly';
    if (file === 'home.html' || file === 'index.html') { priority = '1.0'; freq = 'weekly'; }
    else if (['ati.html', 'solar.html', 'gesture.html', 'rpg.html', 'qr.html'].includes(file)) { priority = '0.9'; }
    else if (['privacy.html', 'terms.html'].includes(file)) { priority = '0.5'; freq = 'yearly'; }
    
    if (file !== 'index.html') {
        sitemapUrls.push(`    <url>\n        <loc>${canonicalUrl}</loc>\n        <changefreq>${freq}</changefreq>\n        <priority>${priority}</priority>\n    </url>`);
    }
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;

fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

fs.writeFileSync(path.join(dir, 'robots.txt'), robots);

console.log("SEO fixes applied successfully.");
