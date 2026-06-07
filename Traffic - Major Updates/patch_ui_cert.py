import re

files = [
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html',
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major UI Change/Mumbai Traffic.html'
]

methods_to_inject = '''saveProfile() {
        const n = document.getElementById('prof-name').value.trim();
        const v = document.getElementById('prof-veh').value;
        if(n.length > 0 && n.length < 3) { toast('Please enter a valid name', 'darkred'); return; }
        S.name = n;
        S.vehicle = v;
        save();
        document.getElementById('profile-dlg').style.display = 'none';
        toast('Profile Saved!', '#3b8c66');
        
        const cnameEl = document.getElementById('cname');
        if(cnameEl) { cnameEl.innerText = S.name || 'DRIVER'; }
    },
    showCert() {
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
    },'''

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        if 'showCert() {' not in text:
            pattern = r'saveProfile\(\)\s*\{[\s\S]*?\},'
            text = re.sub(pattern, methods_to_inject, text, count=1)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"Patched missing UI methods in {filepath}")
        else:
            print(f"Already patched {filepath}")
    except Exception as e:
        print(f"Failed to patch {filepath}: {e}")
