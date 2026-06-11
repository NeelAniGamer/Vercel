from PIL import Image
import glob
import os

def resize_image(file_path, max_width):
    try:
        with Image.open(file_path) as img:
            if img.width > max_width:
                print(f"Resizing {file_path} from {img.width}x{img.height} to {max_width} wide...")
                wpercent = (max_width / float(img.width))
                hsize = int((float(img.height) * float(wpercent)))
                img = img.resize((max_width, hsize), Image.Resampling.LANCZOS)
                img.save(file_path, format="webp", quality=85)
                print(f"Saved {file_path}")
            else:
                print(f"Skipping {file_path}, width is {img.width}")
    except Exception as e:
        print(f"Error on {file_path}: {e}")

resize_image('class.webp', 120)
resize_image('ati.webp', 800)
resize_image('solar.webp', 800)
resize_image('ati 2.webp', 800)
resize_image('ati 3.webp', 800)
