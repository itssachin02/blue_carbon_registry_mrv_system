const fs = require('fs');
try {
  const parser = require('@babel/parser');
  const text = fs.readFileSync('components/admin/mrv-verification.tsx','utf8');
  try {
    parser.parse(text, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: false });
    console.log('babel parse succeeded');
  } catch (err) {
    console.error('babel parse failed');
    console.error(err.message);
    if (err.loc) {
      console.error('line', err.loc.line, 'col', err.loc.column);
      const lines = text.split(/\r?\n/);
      console.error('context:', lines[err.loc.line-1]);
    }
  }
} catch (err) {
  console.error('cannot require @babel/parser', err.message);
  process.exit(1);
}
