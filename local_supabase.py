import glob

def use_local_supabase():
    html_files = glob.glob("*.html")
    old_script = '<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
    new_script = '<script defer src="supabase.js"></script>'
    
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if old_script in content:
            content = content.replace(old_script, new_script)
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {html_path}")
            
if __name__ == "__main__":
    use_local_supabase()
