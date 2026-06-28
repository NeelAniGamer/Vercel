import os, re
for i in range(1, 21):
    path = f"levels/level{i}.js"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if '"name":' in line:
                    print(f"Level {i}: {line.strip()}")
                    break
