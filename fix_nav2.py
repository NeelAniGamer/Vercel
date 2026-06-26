import glob, re, os

files = glob.glob('*.html')
count = 0
project_pages = ['ati.html', 'solar.html', 'gesture.html', 'rpg.html', 'qr.html', 'qr-editor.html', 'ati-demo.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    orig_content = content
    
    # Strip act class from dropdown-btn
    content = re.sub(r'class="dropdown-btn\s+act"', 'class="dropdown-btn"', content)
    
    basename = os.path.basename(f)
    if basename in project_pages:
        # Add act to dropdown-btn
        content = content.replace('class="dropdown-btn"', 'class="dropdown-btn act"')
    
    if orig_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        count += 1
        
print(f'Done adding act to dropdown button in {count} files.')
