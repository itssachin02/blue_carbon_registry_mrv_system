const fs = require('fs');
const ts = require('typescript');
const file = 'components/admin/mrv-verification.tsx';
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('const handleExportSummary = () => {');
if (start === -1) {
  console.error('not found');
  process.exit(1);
}
let depth = 0;
let end = -1;
for (let i = start; i < src.length; i++) {
  const ch = src[i];
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
if (end === -1) {
  console.error('end not found');
  process.exit(1);
}
const modified = src.slice(0, start) + '/*handleExportSummary removed*/' + src.slice(end);
const sf = ts.createSourceFile(file, modified, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log(sf.parseDiagnostics.map(d => ({ code: d.code, message: d.messageText, start: d.start, length: d.length })).slice(0, 20));
