import os
import re

dir_path = '.'

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # 1. Remove loginMo block if it's not a QR page
        is_qr = os.path.basename(filepath) in ['qr.html', 'qr-editor.html']
        if not is_qr and '<div class="mo" id="loginMo"' in content:
            # We will use regex to capture the entire modal. 
            # It usually ends with Maybe Later</button></div></div></div> or similar.
            # Let's just find the index of '<div class="mo" id="loginMo"' and remove the whole chunk.
            content = re.sub(r'<div class="mo" id="loginMo".*?</button></div></div></div>\n?', '', content, flags=re.DOTALL)
            
        # 3. Intersection Observer for Three.js
        if 'requestAnimationFrame(tick)' in content and 'IntersectionObserver' not in content and 'function tick' in content:
            content = re.sub(r'(var clock=new THREE\.Clock\(\);)',
                             r'\1\n  var isVisible=true;var heroSec=document.querySelector("section, header, canvas")||document.body;if(heroSec){new IntersectionObserver(function(es){isVisible=es[0].isIntersecting;}).observe(heroSec);}', content)
            content = re.sub(r'(function tick\(\)\s*\{[^\n]*\n\s*requestAnimationFrame\(tick\);)',
                             r'\1\n    if(!isVisible)return;', content)
            
        # Ensure scripts are deferred. (e.g., three.min.js)
        content = re.sub(r'<script src="([^"]+three\.min\.js)"></script>', r'<script defer src="\1"></script>', content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

for root, _, files in os.walk(dir_path):
    for f in files:
        if f.endswith('.html'):
            process_file(os.path.join(root, f))
