from pathlib import Path
import sys

path = Path('components/admin/mrv-verification.tsx')
text = path.read_text(encoding='utf-8')
stack = []
line = 1
state = 'normal'
escape = False
quote = None
prev = None

for ch in text:
    if ch == '\n':
        line += 1
        if state == 'line_comment':
            state = 'normal'
        prev = None
        continue
    if state == 'string':
        if escape:
            escape = False
            prev = ch
            continue
        if ch == '\\':
            escape = True
            prev = ch
            continue
        if ch == quote:
            state = 'normal'
            quote = None
        prev = ch
        continue
    if state == 'template':
        if escape:
            escape = False
            prev = ch
            continue
        if ch == '\\':
            escape = True
            prev = ch
            continue
        if ch == '`':
            state = 'normal'
            prev = ch
            continue
        prev = ch
        continue
    if state == 'block_comment':
        if prev == '*' and ch == '/':
            state = 'normal'
            prev = None
        else:
            prev = ch
        continue
    if state == 'line_comment':
        prev = ch
        continue
    if ch == '/':
        if prev == '/':
            state = 'line_comment'
            prev = None
            continue
        if prev == '*':
            state = 'block_comment'
            prev = None
            continue
        prev = ch
        continue
    prev = None
    if ch in ('"', "'", '`'):
        if ch == '`':
            state = 'template'
        else:
            state = 'string'
        quote = ch
        prev = ch
        continue
    if ch == '{':
        stack.append(('brace', line, ch))
    elif ch == '}':
        if not stack or stack[-1][0] != 'brace':
            print('unbalanced } at line', line)
            sys.exit(1)
        stack.pop()
    elif ch == '(':
        stack.append(('paren', line, ch))
    elif ch == ')':
        if not stack or stack[-1][0] != 'paren':
            print('unbalanced ) at line', line)
            sys.exit(1)
        stack.pop()
    elif ch == '[':
        stack.append(('brack', line, ch))
    elif ch == ']':
        if not stack or stack[-1][0] != 'brack':
            print('unbalanced ] at line', line)
            sys.exit(1)
        stack.pop()

if stack:
    print('stack remains', stack[-10:])
    sys.exit(1)
print('balanced')
