from pathlib import Path
text = Path('components/admin/mrv-verification.tsx').read_text(encoding='utf-8')
lines = text.splitlines()
for i in range(215, 265):
    print(f'{i+1}: {lines[i]!r}')
