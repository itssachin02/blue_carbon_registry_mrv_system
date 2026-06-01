const fs = require('fs');
const ts = require('typescript');
const file = 'components/admin/mrv-verification.tsx';
const source = fs.readFileSync(file,'utf8');
const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source);
let token = scanner.scan();
let count=0;
while (token !== ts.SyntaxKind.EndOfFileToken && count < 40) {
  const start = scanner.getTokenPos();
  const text = source.slice(start, scanner.getTextPos());
  const { line, character } = sf.getLineAndCharacterOfPosition(start);
  console.log(count, 'line', line+1, 'col', character+1, 'token', ts.SyntaxKind[token], 'text', JSON.stringify(text));
  count++;
  token = scanner.scan();
}
