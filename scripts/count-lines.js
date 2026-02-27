import fs from 'fs';
import path from 'path';

const extensions = ['.tsx', '.ts', '.js', '.jsx', '.css'];
const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build'];

let totalLines = 0;
let totalFiles = 0;
const fileCounts = {};

function countLines(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item)) {
        countLines(fullPath);
      }
    } else {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').length;
        totalLines += lines;
        totalFiles++;
        fileCounts[ext] = (fileCounts[ext] || 0) + lines;
      }
    }
  }
}

countLines(process.cwd());

console.log('=== MOAP Code Statistics ===');
console.log(`Total Files: ${totalFiles}`);
console.log(`Total Lines: ${totalLines}`);
console.log('\nBy Extension:');
for (const [ext, lines] of Object.entries(fileCounts)) {
  console.log(`  ${ext}: ${lines} lines`);
}
