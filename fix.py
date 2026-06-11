import glob

replacements = {
    'width="958" height="958" fetchpriority="high"': 'width="56" height="56" fetchpriority="high" decoding="async"',
    'width="958" height="958" loading="lazy"': 'width="56" height="56" loading="lazy" decoding="async"',
    'width="3839" height="2103" fetchpriority="high"': 'width="800" height="438" fetchpriority="high" decoding="async"',
    'width="3839" height="2103" loading="lazy"': 'width="800" height="438" loading="lazy" decoding="async"',
    'width="3839" height="2094"': 'width="800" height="436"',
    'width="3839" height="2094" loading="lazy"': 'width="800" height="436" loading="lazy" decoding="async"'
}

for f in glob.glob('*.html'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    modified = False
    for target, replacement in replacements.items():
        if target in content:
            content = content.replace(target, replacement)
            modified = True
            
    if modified:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Fixed {f}")
