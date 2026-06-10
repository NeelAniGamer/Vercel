import glob

def fix_spa_vars():
    html_files = glob.glob("*.html")
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace const/let with var for top-level inline script vars to prevent SPA router SyntaxError
        content = content.replace('const Storage = {', 'var Storage = {')
        content = content.replace('const GOOGLE_CLIENT_ID', 'var GOOGLE_CLIENT_ID')
        content = content.replace('let curUser = null', 'var curUser = null')
        content = content.replace('let googleAccessToken', 'var googleAccessToken')
        
        # Also fix any stray declarations that might have spaces
        content = content.replace('const Storage=', 'var Storage=')
        content = content.replace('const  Storage', 'var Storage')
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    fix_spa_vars()
