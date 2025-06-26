const fs = require('fs');
const path = require('path');

// Production cleanup script
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const SRC_DIR = path.join(__dirname, '../src');

function cleanupFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remove console.log statements (but keep console.error for production logging)
  const originalLength = content.length;
  content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
  
  // Remove empty lines that were left after console.log removal
  content = content.replace(/^\s*$/gm, '').replace(/\n\n\n+/g, '\n\n');
  
  if (content.length !== originalLength) {
    modified = true;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned: ${path.relative(process.cwd(), filePath)}`);
  }
  
  return modified;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalCleaned = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      totalCleaned += walkDirectory(fullPath);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(file))) {
      if (cleanupFile(fullPath)) {
        totalCleaned++;
      }
    }
  }
  
  return totalCleaned;
}

console.log('🧹 Starting production cleanup...');
const cleaned = walkDirectory(SRC_DIR);
console.log(`✅ Production cleanup complete! Cleaned ${cleaned} files.`); 