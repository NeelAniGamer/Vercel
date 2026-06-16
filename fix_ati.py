import os, re
path = os.path.join(r'c:\Users\neelg\OneDrive\Desktop\Vercel', 'ati.html')
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Light/Dark mode
content = re.sub(r'<div class="tw">.*?</div>', '', content, flags=re.DOTALL)
content = re.sub(r'\.theme-switch-wrapper\s*\{\s*display:\s*none;\s*\}', '', content, flags=re.DOTALL)
# The JS in ati.html comes from logic.js or something else. I will check logic.js later.
# For now, remove the toggle HTML.
content = re.sub(r'<div class="tw">.*?</div>', '', content, flags=re.DOTALL)

# 2. Fix Emojis
content = re.sub(r'>[^<]*? Play Web Demo<', '>\U0001F3AE Play Web Demo<', content)

# Feature cards
content = re.sub(r'<h3>[^<]*?Active Feedback</h3>', '<h3>\U0001F4A1 Active Feedback</h3>', content)
content = re.sub(r'<h3>[^<]*?Progress Tracking</h3>', '<h3>\U0001F4C8 Progress Tracking</h3>', content)
content = re.sub(r'<h3>[^<]*?Adaptive Learning</h3>', '<h3>\U0001F9E0 Adaptive Learning</h3>', content)

# Random Line bug
content = content.replace(' | ', ' &middot; ') 

# 3. Fix Images in System Interfaces
content = content.replace("'ati.png'", "'ati.webp'")
content = content.replace("'ati 2.png'", "'ati 2.webp'")
content = content.replace("'ati 3.png'", "'ati 3.webp'")

# Fix "The Sig In Problem, Some Code Error In The Site Cause Not Syncing The Data"
# It mentions "Some Code Error In The Site Cause Not Syncing The Data". This might be due to `qrs_user` vs `ati_user` in localStorage?
# Let's see later.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed ati.html emojis and images and theme switch.')
