import re

files = [
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html',
    'c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major UI Change/Mumbai Traffic.html'
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
            
        # Fix showCert
        text = text.replace(
            "this.hideAll();\n        document.getElementById('screen-certificate').style.display = 'block';",
            "this.show('screen-certificate');"
        )
        # Fix showBadges
        text = text.replace(
            "this.hideAll();\n        const screen = document.getElementById('screen-badges');\n        if(screen) screen.style.display = 'block';",
            "this.show('screen-badges');"
        )
        
        # Also catch any variations with differing whitespace
        text = re.sub(r'this\.hideAll\(\);\s*document\.getElementById\(\'screen-certificate\'\)\.style\.display\s*=\s*\'block\';', "this.show('screen-certificate');", text)
        text = re.sub(r'this\.hideAll\(\);\s*const screen = document\.getElementById\(\'screen-badges\'\);\s*if\s*\(screen\)\s*screen\.style\.display\s*=\s*\'block\';', "this.show('screen-badges');", text)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Fixed this.hideAll in {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")
