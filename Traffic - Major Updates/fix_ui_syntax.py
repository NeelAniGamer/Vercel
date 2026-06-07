import re

files = [
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html',
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major UI Change/Mumbai Traffic.html'
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
            
        # The exact corrupted text we want to fix:
        # From the first `showCert() {` down to `dlCert() { ... },`
        # We will replace it all with a clean set of functions.
        
        pattern = r'showCert\(\)\s*\{.*?dlCert\(\)\s*\{.*?\},\s*cur:\s*null'
        
        replacement = '''showCert() {
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
    },
    dlCert() {
        if(typeof html2pdf !== 'undefined') {
            const el = document.getElementById('cert-wrapper');
            html2pdf().set({
                margin: 0,
                filename: 'Traffic_Hero_Certificate.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            }).from(el).save();
        } else {
            alert('PDF library not loaded. Please ensure you have internet access.');
        }
    },
    cur: null'''

        if re.search(pattern, text, re.DOTALL):
            text = re.sub(pattern, replacement, text, flags=re.DOTALL)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"Fixed ui syntax in {filepath}")
        else:
            print(f"Pattern not found in {filepath}. Let me investigate.")
            import textwrap
            print("Snippets:")
            m = re.search(r'showCert\(\)\s*\{.{0,200}', text, flags=re.DOTALL)
            if m: print(m.group(0))

    except Exception as e:
        print(f"Error {filepath}: {e}")
