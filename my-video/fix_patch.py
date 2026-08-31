import pathlib
p = pathlib.Path("src/scenes/ResearchTechStackReport.tsx")
t = p.read_text(encoding="utf-8")
lines = t.splitlines()
for i in range(841,845):
    print(f"{i+1}: {lines[i]!r}")

# Fix the problematic line - replace the broken JSX
old = '<span style={{ color: \'#F2B84B\' }}>"destination":"/home"</span> {\'}']'
if old in t:
    print("found old1")
    t = t.replace(old, '<span style={{ color: \'#F2B84B\' }}>"destination":"/home"</span>}]')
else:
    print("old1 not found")

# Also check for any remaining weird pattern
if "{\'}']" in t:
    print("found stray")
    t = t.replace("{\'}']", "}]")
    print("replaced stray")

# Write back
p.write_text(t, encoding="utf-8")
print("done")
# verify
t2 = p.read_text(encoding="utf-8")
for i in range(841,845):
    print(f"AFTER {i+1}: {t2.splitlines()[i]!r}")
