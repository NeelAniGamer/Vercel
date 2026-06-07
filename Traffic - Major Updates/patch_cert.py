import re

files = [
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html',
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major UI Change/Mumbai Traffic.html'
]

replacement = '''<div style="margin-bottom:30px;display:flex;align-items:center;justify-content:space-between;width:100%;">
<div style="display:flex;align-items:center;gap:16px;">
<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24'><path d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z' fill='%23d97757'/></svg>" style="height:60px;" alt="Logo" onerror="this.style.display='none'" />
<div style="text-align:left;">
<div style="font-weight:700;letter-spacing:0.05em;color:#7c7968;font-size:1.1rem;">MUMBAI TRAFFIC POLICE</div>
<div style="font-size:0.9rem;color:#a09e91;">ROAD SAFETY ACADEMY</div>
</div>
</div>
<div style="display:flex;gap:16px;align-items:center;">
<img src="image_fd3503.png" style="height:60px;object-fit:contain;" alt="Logo 1" onerror="this.style.display='none'" />
<img src="image_fd3505.png" style="height:60px;object-fit:contain;" alt="Logo 2" onerror="this.style.display='none'" />
</div>
</div>'''

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        pattern = r'<div style="margin-bottom:30px;display:flex;align-items:center;gap:16px;">.*?<div style="font-size:0\.9rem;color:#a09e91;">ROAD SAFETY ACADEMY</div>\s*</div>\s*</div>'
        text = re.sub(pattern, replacement, text, flags=re.DOTALL)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Patched {filepath}")
    except Exception as e:
        print(f"Failed to patch {filepath}: {e}")
