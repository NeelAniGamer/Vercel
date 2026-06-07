import re

file_path = "c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Profile" in line:
        print(f"Line {i+1}: {line.strip()}")
    if "Developer" in line:
        print(f"Line {i+1}: {line.strip()}")
