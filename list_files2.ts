import fs from 'fs';
try { console.log('/workspace:', fs.readdirSync('/workspace')); } catch(e){}
try { console.log('/app:', fs.readdirSync('/app')); } catch(e){}
