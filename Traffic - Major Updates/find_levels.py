with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'name:' in line and 'Final Evaluation' in line:
        start = max(0, i-10)
        end = min(len(lines), i+10)
        for j in range(start, end):
            print(f'{j}: {lines[j].strip().encode("ascii", "ignore").decode("ascii")}')
    if '15: { name: \'South Mumbai Circuit\'' in line:
        start2 = max(0, i-5)
        end2 = min(len(lines), i+5)
        for j in range(start2, end2):
            print(f'{j}: {lines[j].strip()[:100].encode("ascii", "ignore").decode("ascii")}')
