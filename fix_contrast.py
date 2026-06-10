import os
import re
import glob

def fix_contrast():
    html_files = glob.glob("*.html")
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace light mode muted text to be darker
        content = content.replace('#4b5563', '#374151')
        
        # Replace dark mode muted text to be lighter
        content = content.replace('#94a3b8', '#cbd5e1')

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    fix_contrast()
    print("Contrast fixed!")
