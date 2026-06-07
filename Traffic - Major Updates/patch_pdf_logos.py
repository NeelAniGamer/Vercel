import base64
import os
import re

files = [
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html',
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major UI Change/Mumbai Traffic.html'
]

dir_path = 'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates'
img1_path = os.path.join(dir_path, 'image_fd3503.png')
img2_path = os.path.join(dir_path, 'image_fd3505.png')

b1 = ""
b2 = ""

if os.path.exists(img1_path):
    with open(img1_path, 'rb') as f:
        b1 = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')

if os.path.exists(img2_path):
    with open(img2_path, 'rb') as f:
        b2 = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
            
        # 1. Remove the old SVG block
        pattern = r'<div style=\"display:flex;align-items:center;gap:16px;\">\s*<img src=\"data:image/svg\+xml;utf8,[^\"]+\"\s*style=\"height:60px;\"\s*alt=\"Logo\"[^>]+>\s*<div style=\"text-align:left;\">\s*<div[^>]+>MUMBAI TRAFFIC POLICE</div>\s*<div[^>]+>ROAD SAFETY ACADEMY</div>\s*</div>\s*</div>'
        text = re.sub(pattern, '', text, count=1)
        
        # 2. Replace the image srcs with base64 so html2canvas doesn't crash
        if b1:
            text = text.replace('src="image_fd3503.png"', f'src="{b1}"')
        if b2:
            text = text.replace('src="image_fd3505.png"', f'src="{b2}"')
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Patched logos and images in {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")
