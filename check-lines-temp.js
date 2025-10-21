const fs = require('fs');

const files = [
  'D:\\code\\WSJF\\src\\wsjf-sprint-planner.tsx',
  'D:\\code\\WSJF\\src\\components\\import\\ImportPreviewModal.tsx'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const nonEmptyLines = content.split('\n').filter(line => line.trim() !== '');
  const allLines = content.split('\n').length;
  const fileName = file.split('\\').pop();
  console.log(`${fileName}:`);
  console.log(`  Total lines: ${allLines}`);
  console.log(`  Non-empty lines: ${nonEmptyLines.length}`);
  console.log('');
});
