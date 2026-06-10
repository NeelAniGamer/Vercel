import re

def update_files():
    with open(r'c:\Users\neelg\OneDrive\Desktop\Vercel\index.html', 'r', encoding='utf-8') as f:
        index_html = f.read()

    # Extract HTML
    nav_html_match = re.search(r'(<nav class="top-nav">.*?</nav>)', index_html, re.DOTALL)
    nav_html = nav_html_match.group(1)

    # Extract main CSS
    nav_css_match = re.search(r'(\.top-nav \{.*?\.mobile-dl \{ display: none; \})', index_html, re.DOTALL)
    nav_css = nav_css_match.group(1)

    # Extract mobile CSS
    mobile_css_match = re.search(r'(\.desktop-dl \{ display: none; \}.*?\.theme-switch-wrapper \{ margin: 10px auto 0; width: 100%; justify-content: center; border-left: none; padding-left: 0; \})', index_html, re.DOTALL)
    mobile_css = mobile_css_match.group(1)

    for file_path in [r'c:\Users\neelg\OneDrive\Desktop\Vercel\qr.html', r'c:\Users\neelg\OneDrive\Desktop\Vercel\qr-editor.html']:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Inject variables into :root
        root_inject = """
  --google-blue: var(--pri);
  --text-main: var(--txt);
  --text-muted: var(--txt-m);
  --nav-bg: var(--nav);
  --border-light: var(--border);
  --card-bg: var(--panel);
}"""
        if '--google-blue' not in content:
            content = re.sub(r'(\s*--font-main:[^}]*?)\}', r'\1' + root_inject, content, count=1)
        
        # Replace HTML
        content = re.sub(r'<nav class="top-nav">.*?</nav>', nav_html.replace('\\', '\\\\'), content, flags=re.DOTALL)
        
        # Replace main CSS
        content = re.sub(r'\.top-nav \{.*?(?=\n\n/\* (SIDEBAR|COMPONENT PANELS) \*/)', nav_css, content, flags=re.DOTALL)
        
        # Replace mobile CSS
        content = re.sub(r'\.nav-brand \{ font-size: 1\.2rem; \}\n.*?\.theme-switch-wrapper \{ border-left: none; padding-left: 0; justify-content: center; margin-top: 10px; \}', mobile_css.replace('\\', '\\\\'), content, flags=re.DOTALL)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == '__main__':
    update_files()
    print("Successfully replaced nav html and css!")
