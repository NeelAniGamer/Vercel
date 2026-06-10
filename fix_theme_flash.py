import glob

def fix_theme_flash():
    html_files = glob.glob("*.html")
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Determine theme class
        theme_class = 'dark-mode'
        if 'body.dark ' in content or 'body.dark{' in content or 'body.dark {' in content:
            theme_class = 'dark'

        script_to_inject = f"""<script>
    (function(){{
        try {{
            if (localStorage.getItem('theme') === 'dark') {{
                document.body.classList.add('{theme_class}');
            }}
        }} catch(e) {{}}
    }})();
</script>"""

        # 1. Strip hardcoded dark class from body
        content = content.replace('<body class="dark-mode">', '<body>')
        content = content.replace('<body class="dark">', '<body>')
        
        # 2. Inject the synchronous theme script right after <body>
        if "localStorage.getItem('theme')" not in content[:content.find('</nav>') if '</nav>' in content else len(content)]:
            content = content.replace('<body>', f'<body>\n{script_to_inject}', 1)

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
if __name__ == "__main__":
    fix_theme_flash()
