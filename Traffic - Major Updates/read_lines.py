with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(3240, 3260):
        if i < len(lines):
            print(f'{i+1}: {lines[i].encode("ascii", "ignore").decode("ascii").rstrip()}')
