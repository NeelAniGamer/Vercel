with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'id="ss"' in line:
        for j in range(i, i+50):
            try:
                print(f'{j+1}: {lines[j].strip()}')
            except Exception:
                pass
        break
