from pathlib import Path
text = Path('components/admin/mrv-verification.tsx').read_text(encoding='utf-8')
indices = [i for i, ch in enumerate(text) if ch == '`']
print('count', len(indices))
for idx in indices:
    line = text.count('\n', 0, idx) + 1
    col = idx - text.rfind('\n', 0, idx)
    print(idx, 'line', line, 'col', col)
