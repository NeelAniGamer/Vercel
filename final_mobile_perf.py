import os
import glob
import re

def fix_fonts():
    html_files = glob.glob("*.html")
    old_fonts = """<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">"""
    
    new_fonts = """<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <noscript>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    </noscript>"""
    
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if old_fonts in content:
            content = content.replace(old_fonts, new_fonts)
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed fonts in {html_path}")

def fix_lcp_images():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove lazy loading from LCP candidates and add fetchpriority="high"
        # 1. class.webp
        content = content.replace('src="class.webp" alt="Class Of Learners Logo" class="brand-logo" width="958" height="958" loading="lazy"', 
                                  'src="class.webp" alt="Class Of Learners Logo" class="brand-logo" width="958" height="958" fetchpriority="high"')
        
        # 2. ati.webp
        content = content.replace('src="ati.webp" alt="Advanced Typing Instructor" width="3839" height="2103" loading="lazy"',
                                  'src="ati.webp" alt="Advanced Typing Instructor" width="3839" height="2103" fetchpriority="high"')
        
        # 3. solar.webp
        content = content.replace('src="solar.webp" alt="Solar System Engine" width="3839" height="2094" loading="lazy"',
                                  'src="solar.webp" alt="Solar System Engine" width="3839" height="2094"')

        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed LCP images in index.html")
    except Exception as e:
        print(f"Error fixing images: {e}")

if __name__ == "__main__":
    fix_fonts()
    fix_lcp_images()
