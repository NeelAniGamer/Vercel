import re

files = [
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html',
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major UI Change/Mumbai Traffic.html'
]

methods_to_inject = '''showCert() {
        this.hideAll();
        document.getElementById('screen-certificate').style.display = 'block';
        
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
    },
    showBadges() {
        this.hideAll();
        const screen = document.getElementById('screen-badges');
        if(screen) screen.style.display = 'block';
        
        const statsBody = document.getElementById('stats-body');
        if (statsBody) {
            statsBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">COMPLETED LEVELS</div>
                    <div style="font-weight:700;color:var(--accent);">${Object.keys(S.comp).length}/15</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">TOTAL WALLET</div>
                    <div style="font-weight:700;color:#2ecc71;">₹${S.wallet || 0}</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <div style="color:#666;font-size:0.9rem;font-weight:600;">TOTAL BADGES</div>
                    <div style="font-weight:700;color:#9b59b6;">${S.badges ? S.badges.length : 0}</div>
                </div>
            `;
        }
        
        const bgrid = document.getElementById('bgrid');
        if (bgrid && typeof BADGES !== 'undefined') {
            let bHtml = '';
            BADGES.forEach(b => {
                const has = S.badges && S.badges.includes(b.id);
                bHtml += `
                    <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid ${has ? '#ffd54a' : '#eee'};text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.05);filter:${has ? 'none' : 'grayscale(1)'};opacity:${has ? '1' : '0.5'};">
                        <div style="font-size:3rem;margin-bottom:10px;">${b.icon}</div>
                        <div style="font-weight:700;margin-bottom:6px;color:#2c3e50;">${b.name}</div>
                        <div style="font-size:0.85rem;color:#666;">${b.desc}</div>
                    </div>
                `;
            });
            bgrid.innerHTML = bHtml;
        }
    },'''

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        if 'showBadges() {' not in text:
            pattern = r'showCert\(\)\s*\{'
            text = re.sub(pattern, methods_to_inject, text, count=1)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"Patched missing UI methods in {filepath}")
        else:
            print(f"Already patched {filepath}")
    except Exception as e:
        print(f"Failed to patch {filepath}: {e}")
