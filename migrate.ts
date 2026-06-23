import { execSync } from 'child_process';
import fs from 'fs';

try {
  fs.mkdirSync('avora_repo');
  const files = ['src', 'public', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js', '.env', '.env.example', '.gitignore', 'supabase', 'metadata.json', 'vercel.json'];
  
  for (const f of files) {
    if (fs.existsSync(f)) {
      execSync(`mv ${f} avora_repo/`);
    }
  }
  
  // also move node_modules to avoid reinstall
  if (fs.existsSync('node_modules')) {
    execSync('mv node_modules avora_repo/');
  }

  // Create root package.json
  const rootPkg = {
    "name": "workspace-root",
    "private": true,
    "scripts": {
      "dev": "cd avora_repo && npm run dev",
      "build": "cd avora_repo && npm run build",
      "preview": "cd avora_repo && npm run preview",
      "lint": "cd avora_repo && npm run lint"
    }
  };
  fs.writeFileSync('package.json', JSON.stringify(rootPkg, null, 2));

  // Create a dummy App.tsx at root just in case? No, the prompt says:
  // "Remove any dependency on the empty root-level src/App.tsx."
  // So maybe I just delete src completely from root if it was there.
  if (fs.existsSync('src')) {
     execSync('rm -rf src');
  }

  console.log("Migration complete.");
} catch (e) {
  console.log("Error:", e);
}
