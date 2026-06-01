const fs = require('fs');
const ts = require('typescript');
const file = 'components/admin/mrv-verification.tsx';
const source = fs.readFileSync(file,'utf8');
const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source);
let token = scanner.scan();
let maxLine = 0;
let total = 0;
while (token !== ts.SyntaxKind.EndOfFileToken) {
  const start = scanner.getTokenPos();
  const { line } = sf.getLineAndCharacterOfPosition(start);
  if (line > maxLine) maxLine = line;
  total++;
  token = scanner.scan();
}
console.log('maxLine', maxLine+1, 'totalTokens', total);
