import { execSync } from 'child_process';
try {
  console.log(execSync('grep -r "avora_repo" /app/applet 2>/dev/null').toString());
} catch (e) {
  console.log(e.message);
}
