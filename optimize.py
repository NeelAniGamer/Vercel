import os
import re
import glob
from PIL import Image

def optimize_images():
    image_files = glob.glob("*.png") + glob.glob("*.jpg")
    for img_path in image_files:
        try:
            with Image.open(img_path) as img:
                webp_path = os.path.splitext(img_path)[0] + ".webp"
                img.save(webp_path, "WEBP", quality=80)
                print(f"Converted {img_path} to {webp_path}")
        except Exception as e:
            print(f"Failed to convert {img_path}: {e}")

def update_html():
    html_files = glob.glob("*.html")
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Update image extensions to .webp (only local)
        def repl_img(match):
            src = match.group(1)
            ext = match.group(2)
            if src.startswith('http') or src.startswith('data:'):
                return match.group(0)
            return f'src="{src}.webp"'
            
        content = re.sub(r'src="([^"]+)\.(png|jpg)"', repl_img, content)

        # 2. Add explicit width and height
        img_tags = re.findall(r'<img[^>]+>', content)
        for tag in img_tags:
            src_match = re.search(r'src="([^"]+)"', tag)
            if src_match:
                src = src_match.group(1)
                if src.startswith('data:') or src.startswith('http'):
                    continue
                
                # If width or height exists, skip
                if 'width=' in tag or 'height=' in tag:
                    continue
                
                # Get dimensions from the webp file
                if os.path.exists(src):
                    try:
                        with Image.open(src) as img:
                            w, h = img.size
                            new_tag = tag
                            if new_tag.endswith('/>'):
                                new_tag = new_tag[:-2] + f' width="{w}" height="{h}"/>'
                            elif new_tag.endswith('>'):
                                new_tag = new_tag[:-1] + f' width="{w}" height="{h}">'
                            content = content.replace(tag, new_tag)
                            print(f"Added dims {w}x{h} to {src} in {html_path}")
                    except Exception as e:
                        print(f"Error sizing {src}: {e}")
        
        # 3. Add meta description
        if '<meta name="description"' not in content.lower():
            name = os.path.splitext(html_path)[0].replace('-', ' ').title()
            description = f"Class of Learners - {name}. An educational tool and resource."
            if '<head>' in content:
                content = content.replace('<head>', f'<head>\n    <meta name="description" content="{description}">', 1)
                print(f"Added meta description to {html_path}")

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    optimize_images()
    update_html()
