import os
import re
import glob

def add_lazy_loading():
    html_files = glob.glob("*.html")
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Add loading="lazy" to all img tags that don't have it
        def repl_img(match):
            tag = match.group(0)
            if 'loading=' not in tag:
                if tag.endswith('/>'):
                    return tag[:-2] + ' loading="lazy"/>'
                elif tag.endswith('>'):
                    return tag[:-1] + ' loading="lazy">'
            return tag
            
        content = re.sub(r'<img[^>]+>', repl_img, content)

        # Add defer to script tags that have src but no defer
        def repl_script(match):
            tag = match.group(0)
            if ' src=' in tag and 'defer' not in tag and 'async' not in tag:
                return tag.replace('<script ', '<script defer ')
            return tag
            
        content = re.sub(r'<script[^>]+>', repl_script, content)

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    add_lazy_loading()
    print("Added lazy loading and deferred scripts!")
