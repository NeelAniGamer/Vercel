import os, glob
version = str(os.path.getmtime('col-ui.css'))
for f in glob.glob('*.html'):
    try:
        content = open(f, encoding='utf-8').read()
        if 'href="col-ui.css"' in content:
            content = content.replace('href="col-ui.css"', f'href="col-ui.css?v={version}"')
            open(f, 'w', encoding='utf-8').write(content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Failed {f}: {e}")
