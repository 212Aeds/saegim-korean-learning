const {spawn}=require('node:child_process');
const {existsSync}=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const python=path.join(root,'apps/local-speech/.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
if(!existsSync(python))throw Error('Set up apps/local-speech/.venv first; see apps/local-speech/README.md');
const child=spawn(python,['-u','apps/local-speech/server.py'],{cwd:root,stdio:'inherit'});
child.on('exit',code=>{process.exitCode=code??1;});
