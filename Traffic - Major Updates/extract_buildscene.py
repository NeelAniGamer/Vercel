with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    text = f.read()
import re
b = re.search(r'(_buildScene[\s\S]*?)(?=\s+_pmesh)', text, re.DOTALL)
if b:
    with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/buildscene.txt', 'w', encoding='utf-8') as out:
        out.write(b.group(1))
