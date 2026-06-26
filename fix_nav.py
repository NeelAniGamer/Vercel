import glob, re, os

files = glob.glob('*.html')
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    orig_content = content
    
    content = content.replace('>Home Hub<', '>Home<')
    content = content.replace('>About Us<', '>About<')
    content = content.replace('>Our School<', '>School<')
    
    # Strip act classes
    content = re.sub(r'class="nav-link\s+act"', 'class="nav-link"', content)
    
    # Add act class dynamically to current page
    basename = os.path.basename(f)
    if basename in ['index.html', 'home.html']:
        content = re.sub(r'href="index\.html"\s+class="nav-link"', 'href="index.html" class="nav-link act"', content)
    elif basename == 'about.html':
        content = re.sub(r'href="about\.html"\s+class="nav-link"', 'href="about.html" class="nav-link act"', content)
    elif basename == 'school.html':
        content = re.sub(r'href="school\.html"\s+class="nav-link"', 'href="school.html" class="nav-link act"', content)
    elif basename == 'sneh-asha.html':
        content = re.sub(r'href="sneh-asha\.html"\s+class="nav-link"', 'href="sneh-asha.html" class="nav-link act"', content)
    
    if orig_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        count += 1
        print(f'Modified {f}')
        
print(f'Done modifying {count} files.')
