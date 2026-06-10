import os
import re
import glob

def fix_btn_contrast():
    html_files = glob.glob("*.html")
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix light mode button contrast
        content = content.replace(
            '.nav-login-btn { background: rgba(16,185,129,0.1); color: #10b981;',
            '.nav-login-btn { background: rgba(16,185,129,0.1); color: #047857;'
        )
        
        # Add dark mode overrides for the button
        if 'body.dark-mode .nav-login-btn' not in content:
            insert_point = content.find('.nav-login-btn:hover {')
            if insert_point != -1:
                dark_css = "body.dark-mode .nav-login-btn { color: #34d399; border-color: #34d399; }\n        body.dark-mode .nav-login-btn:hover { background: #34d399; color: #000; box-shadow: 0 0 20px rgba(52,211,153,0.4); }\n        "
                content = content[:insert_point] + dark_css + content[insert_point:]

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    fix_btn_contrast()
    print("Button contrast fixed!")
