import json
import os

target = r'c:\Users\neelg\OneDrive\Desktop\Vercel\careers-data.js'
with open(target, 'r', encoding='utf-8') as f:
    content = f.read()

with open(r'c:\Users\neelg\OneDrive\Desktop\Vercel\new_careers_batch.json', 'r', encoding='utf-8') as f:
    new_careers = json.load(f)

print(f'New careers in batch: {len(new_careers)}')

last_bracket = content.rfind('];')
if last_bracket == -1:
    print('Error: Could not find ]; in careers-data.js')
    exit(1)

added = 0
append_str = ''
for c in new_careers:
    c_id = c['id']
    if f'"id": "{c_id}"' in content or f"'id': '{c_id}'" in content:
        print(f'Skipping already existing: {c_id}')
        continue
    # ensure aka has title
    if 'aka' not in c or not c['aka']:
        c['aka'] = [c['title']]
    json_item = json.dumps(c, indent=2)
    append_str += ',\n' + json_item
    added += 1

if added > 0:
    new_content = content[:last_bracket] + append_str + '\n' + content[last_bracket:]
    with open(target, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Successfully added {added} careers to careers-data.js!')
else:
    print('No careers needed to be added.')
