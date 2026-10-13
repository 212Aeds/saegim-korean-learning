const {spawn}=require('node:child_process');
const {existsSync}=require('node:fs');
const path=require('node:path');
const portable=path.resolve(__dirname,'../../work/ollama/ollama.exe');
const executable=process.env.LOCAL_OLLAMA_BIN||(existsSync(portable)?portable:'ollama');
const child=spawn(executable,['serve'],{stdio:'inherit',env:{...process.env,OLLAMA_HOST:'127.0.0.1:11434',OLLAMA_NO_CLOUD:'1'}});
let stopped=false;
child.on('error',()=>{stopped=true;console.error('Install Ollama or set LOCAL_OLLAMA_BIN to its executable.');process.exitCode=1;});
child.on('exit',code=>{stopped=true;process.exitCode=code??1;});
(async()=>{
 for(let attempt=0;attempt<30&&!stopped;attempt++){
  try{const response=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(1000)});if(response.ok)break;}catch{}
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 if(stopped)return;
 console.log('Warming local tutor. First GPU startup can take a few minutes…');
 const response=await fetch('http://127.0.0.1:11434/api/chat',{
  method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(300000),
  body:JSON.stringify({model:process.env.LOCAL_TUTOR_MODEL||'qwen3:14b',stream:false,
   think:(process.env.LOCAL_TUTOR_MODEL||'').startsWith('gpt-oss')?'low':false,
   keep_alive:'2h',options:{num_ctx:4096,num_batch:512,num_predict:128,...(process.env.LOCAL_TUTOR_CPU_ONLY==='true'?{num_gpu:0}:{})},messages:[{role:'user',content:'Say hello in Korean.'}]}),
 });
 if(!response.ok)throw Error('Download qwen3:14b with ollama pull before starting the tutor.');
 await response.json();console.log('Local tutor ready.');
})().catch(error=>console.error('Tutor warmup failed:',error.message));
