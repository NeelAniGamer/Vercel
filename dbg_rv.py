import os, re
for f in sorted(os.listdir('.')):
    if not f.endswith('.html'):
        continue
    t = open(f, encoding='utf-8', errors='ignore').read()
    rv = len(re.findall(r'rv[\s"]', t))
    io = 'IntersectionObserver' in t
    if rv > 3 or io:
        print(f, '| rv hits:', rv, '| IO:', io)
