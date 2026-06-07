with open('game_class.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(280, 335):
        if i < len(lines):
            print(f'{i}: {lines[i].encode("ascii", "ignore").decode("ascii").strip()}')
