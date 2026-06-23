import fs from 'fs'; 
import path from 'path';

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      if (file === 'avora_repo') {
        console.log('FOUND:', fullPath);
      }
      try {
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git')) {
          walk(fullPath);
        }
      } catch (e) {}
    });
  } catch (e) {}
}

walk('/app');
walk('/workspace');
walk('/');
console.log('Done scanning');
