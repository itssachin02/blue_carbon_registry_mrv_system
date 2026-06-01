const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const file = path.join(__dirname, 'components/admin/mrv-verification.tsx');
const text = fs.readFileSync(file, 'utf8');
const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = sourceFile.parseDiagnostics;
console.log('diagnostics', diagnostics.length);
for (const d of diagnostics) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start || 0);
  console.log(`code=${d.code} line=${line+1} col=${character+1} msg=${d.messageText}`);
  const start = d.start || 0;
  const end = start + (d.length || 1);
  const lineText = text.split(/\r?\n/)[line];
  console.log('context:', lineText);
  console.log('snippet:', JSON.stringify(text.slice(Math.max(0, start-30), Math.min(text.length, end+30))));
}
const backticks = (text.match(/`/g) || []).length;
console.log('backticks', backticks);
const singleQuotes = (text.match(/'/g) || []).length;
console.log('single quotes', singleQuotes);
const doubleQuotes = (text.match(/"/g) || []).length;
console.log('double quotes', doubleQuotes);
