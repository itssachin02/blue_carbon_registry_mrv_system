const fs = require('fs');
const ts = require('typescript');
const file = 'components/admin/mrv-verification.tsx';
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('  return (');
if (start === -1) {
  console.error('return not found');
  process.exit(1);
}
const modified = src.slice(0, start) + '  return null;\n}';
const sf = ts.createSourceFile(file, modified, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log(sf.parseDiagnostics.map(d => ({ code: d.code, message: d.messageText, start: d.start, length: d.length })).slice(0,20));
