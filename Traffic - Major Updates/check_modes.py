with open('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# find the Game class body
match = re.search(r'class Game \{(.*?)\}\s*const ui = ', text, re.DOTALL)
if not match:
    match = re.search(r'class Game \{(.*)\n    \}\s*\}', text, re.DOTALL)

if match:
    game_code = match.group(1)
    
    modes = ['signals', 'pedestrian', 'helmet', 'seatbelt', 'bus', 'railway', 'phone', 'emergency', 'rain', 'lane', 'silentzone', 'overload', 'checkpoint', 'highway', 'final']
    
    # check _pmesh
    pmesh_match = re.search(r'_pmesh\(mode\)\s*\{(.*?)\n      \}', game_code, re.DOTALL)
    if pmesh_match:
        pmesh_code = pmesh_match.group(1)
        print('Analyzing _pmesh for missing cases...')
        missing = []
        for m in modes:
            if m not in pmesh_code:
                missing.append(m)
        print('Modes not explicitly mentioned in _pmesh:', missing)
    else:
        print('_pmesh not found')

    # check update loop for mode handling
    update_match = re.search(r'update\(dt\)\s*\{(.*?)\n      \}', game_code, re.DOTALL)
    if update_match:
        update_code = update_match.group(1)
        missing = []
        for m in modes:
            if m not in update_code:
                missing.append(m)
        print('Modes not explicitly mentioned in update:', missing)
else:
    print('Game class not found.')
