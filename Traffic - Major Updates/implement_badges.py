import re
import traceback

files = [
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html',
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major UI Change/Mumbai Traffic.html'
]

html_logo_old = '''<div style="display:flex;gap:16px;align-items:center;">
<img src="image_fd3503.png" style="height:60px;object-fit:contain;" alt="Logo 1" onerror="this.style.display='none'" />
<img src="image_fd3505.png" style="height:60px;object-fit:contain;" alt="Logo 2" onerror="this.style.display='none'" />
</div>'''

html_logo_new = '''<div style="display:flex;gap:16px;align-items:center;">
<div style="text-align:right; margin-right:4px;">
<div style="font-size:0.8rem; color:#7c7968; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">Partnered With</div>
</div>
<img src="image_fd3503.png" style="height:75px;object-fit:contain;" alt="Logo 1" onerror="this.style.display='none'" />
<img src="image_fd3505.png" style="height:75px;object-fit:contain;" alt="Logo 2" onerror="this.style.display='none'" />
</div>'''

html_title_old = '''<div class="crtn">Traffic Hero Certification</div>

        <div class="crt-body" style="margin-top:32px;">This document certifies that</div>'''

html_title_new = '''<div class="crtn" id="cert-title">Traffic Hero Certification</div>
        <div id="cert-icon" style="font-size:5rem; text-align:center; display:none; margin:20px 0;"></div>

        <div class="crt-body" id="cert-doc-text" style="margin-top:32px;">This document certifies that</div>'''

js_showcert_old = '''    showCert() {
        this.show('screen-certificate');
        
        let totalScore = 0;
        let count = 0;
        if (S.scores) {
            for (let k in S.scores) {
                totalScore += S.scores[k];
                count++;
            }
        }
        let avgScore = count > 0 ? (totalScore / count) : 0;
        
        const cname = document.getElementById('cname');
        if (cname) cname.innerText = (S.name || 'DRIVER').toUpperCase();
        
        const cstat = document.getElementById('cstat');
        if (cstat) cstat.innerText = `COMPLETED WITH ${Math.round(avgScore)}% PROFICIENCY`;
        
        const certNum = document.getElementById('cert-num');
        if (certNum) {
            if (!S.certId) { S.certId = 'CERT-' + Math.floor(Math.random()*1000000); save(); }
            certNum.innerText = S.certId;
        }
    },'''

js_showcert_new = '''    showCert(badgeId = null) {
        this.show('screen-certificate');
        
        const cname = document.getElementById('cname');
        if (cname) cname.innerText = (S.name || 'DRIVER').toUpperCase();
        
        const certNum = document.getElementById('cert-num');
        if (certNum) {
            if (!S.certId) { S.certId = 'CERT-' + Math.floor(Math.random()*1000000); save(); }
        }
        
        const cTitle = document.getElementById('cert-title');
        const cIcon = document.getElementById('cert-icon');
        const cStat = document.getElementById('cstat');
        const cScoreLbl = document.getElementById('cscore');
        
        if (badgeId && typeof BADGES !== 'undefined') {
            const b = BADGES.find(x => x.id === badgeId);
            if (b) {
                if(cTitle) cTitle.innerText = b.name;
                if(cIcon) { cIcon.innerText = b.icon; cIcon.style.display = 'block'; }
                if(cStat) cStat.innerText = `ACHIEVEMENT UNLOCKED: ${b.desc}`;
                if(certNum) certNum.innerText = `BDG-${badgeId.toUpperCase().replace(/[^A-Z]/g,'').substring(0,5)}-${Math.floor(Math.random()*10000)}`;
                if(cScoreLbl) cScoreLbl.innerText = "Mastered";
                return;
            }
        }
        
        // Default behavior
        if(cTitle) cTitle.innerText = "Traffic Hero Certification";
        if(cIcon) cIcon.style.display = 'none';
        
        let totalScore = 0, count = 0;
        if (S.scores) { for (let k in S.scores) { totalScore += S.scores[k]; count++; } }
        let avgScore = count > 0 ? (totalScore / count) : 0;
        if(cStat) cStat.innerText = `COMPLETED WITH ${Math.round(avgScore)}% PROFICIENCY`;
        if(cScoreLbl) cScoreLbl.innerText = `${Math.round(avgScore)}%`;
        if(certNum) certNum.innerText = S.certId;
    },'''

js_showbadges_old = '''bHtml += `
                    <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid ${has ? '#ffd54a' : '#eee'};text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.05);filter:${has ? 'none' : 'grayscale(1)'};opacity:${has ? '1' : '0.5'};">
                        <div style="font-size:3rem;margin-bottom:10px;">${b.icon}</div>
                        <div style="font-weight:700;margin-bottom:6px;color:#2c3e50;">${b.name}</div>
                        <div style="font-size:0.85rem;color:#666;">${b.desc}</div>
                    </div>
                `;'''

js_showbadges_new = '''bHtml += `
                    <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid ${has ? '#ffd54a' : '#eee'};text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.05);filter:${has ? 'none' : 'grayscale(1)'};opacity:${has ? '1' : '0.5'};${has ? 'cursor:pointer;' : ''}" ${has ? `onclick="ui.showCert('${b.id}')"` : ''}>
                        <div style="font-size:3rem;margin-bottom:10px;">${b.icon}</div>
                        <div style="font-weight:700;margin-bottom:6px;color:#2c3e50;">${b.name}</div>
                        <div style="font-size:0.85rem;color:#666;">${b.desc}</div>
                        ${has ? `<div style="margin-top:12px; font-size:0.75rem; color:#ffd54a; font-weight:bold; text-transform:uppercase;">Click to view Certificate</div>` : ''}
                    </div>
                `;'''


for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        # Try to replace each segment
        if html_logo_old in text:
            text = text.replace(html_logo_old, html_logo_new)
        else:
            print("Warning: html_logo_old not found in", filepath)
            
        if html_title_old in text:
            text = text.replace(html_title_old, html_title_new)
        else:
            print("Warning: html_title_old not found in", filepath)

        # To avoid escaping hell with regex, just string replace the known JS blocks
        text = text.replace(js_showcert_old, js_showcert_new)
        if js_showcert_new not in text:
             print("Warning: js_showcert_old not replaced properly in", filepath)
             # Fallback regex just in case
             text = re.sub(r'showCert\(\)\s*\{[\s\S]*?\},', js_showcert_new, text, count=1)

        text = text.replace(js_showbadges_old, js_showbadges_new)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Patched certificate logic in {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")
        traceback.print_exc()
