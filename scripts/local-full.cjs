const {spawn}=require('node:child_process');
const child=spawn(process.execPath,[require.resolve('./local-run.cjs'),process.argv[2]],{
 stdio:'inherit',env:{...process.env,SAEGIM_LOCAL_FULL:'true'}});
child.on('exit',code=>{process.exitCode=code??1;});
