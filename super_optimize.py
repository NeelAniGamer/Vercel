import os
import re
import glob
from PIL import Image

def resize_images():
    webp_files = glob.glob("*.webp")
    for img_path in webp_files:
        try:
            with Image.open(img_path) as img:
                w, h = img.size
                if w > 800:
                    new_w = 800
                    new_h = int((800 / w) * h)
                    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    img.save(img_path, "WEBP", quality=80)
                    print(f"Resized {img_path} to {new_w}x{new_h}")
        except Exception as e:
            print(f"Failed to resize {img_path}: {e}")

def optimize_fonts():
    html_files = glob.glob("*.html")
    preconnect = """<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">"""
    
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace old font link with preconnect links
        old_font = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
        if old_font in content:
            content = content.replace(old_font, preconnect)

            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Added preconnect to {html_path}")

if __name__ == "__main__":
    resize_images()
    optimize_fonts()
