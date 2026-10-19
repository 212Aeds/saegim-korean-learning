const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {recordConversationTurn}=require('../apps/web/app/ui/conversation-recording.ts');
test('soft microphone speech is captured at the native device rate while digital silence is rejected',async()=>{
 const oldNav=Object.getOwnPropertyDescriptor(global,'navigator'),oldClock=Object.getOwnPropertyDescriptor(global,'performance'),oldAudio=global.AudioContext,oldWindow=global.window;
 let processor,elapsed=0,level=0,options,stops=0;const node={connect(){},disconnect(){}};
 Object.defineProperty(global,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stops++;}}]})}}});Object.defineProperty(global,'performance',{configurable:true,value:{now:()=>elapsed}});
 global.window={setTimeout,clearTimeout};global.AudioContext=class{constructor(input){options=input;}sampleRate=48000;state='running';createMediaStreamSource(){return node;}createScriptProcessor(){processor={...node};return processor;}createGain(){return {...node,gain:{value:1}};}async resume(){}async close(){this.state='closed';}};
 const feed=samples=>processor.onaudioprocess({inputBuffer:{getChannelData:()=>samples}});
 try{
 const recording=recordConversationTurn(new AbortController().signal,value=>{level=Math.max(level,value);});await new Promise(resolve=>setImmediate(resolve));assert.equal(options,undefined);
 const quiet=Float32Array.from({length:4096},(_,i)=>.0012*Math.sin(2*Math.PI*220*i/48000));elapsed=500;feed(quiet);elapsed=600;feed(quiet);assert.ok(level>=5,'soft speech must show a visible input level');elapsed=2600;feed(new Float32Array(4096));const wav=await recording;assert.equal(new DataView(wav).getUint32(24,true),16000);
 const silent=recordConversationTurn(new AbortController().signal,()=>{});await new Promise(resolve=>setImmediate(resolve));elapsed+=8100;feed(new Float32Array(4096));await assert.rejects(silent,/No speech detected/);assert.equal(stops,2);
 }finally{Object.defineProperty(global,'navigator',oldNav);Object.defineProperty(global,'performance',oldClock);global.AudioContext=oldAudio;global.window=oldWindow;}
});

test('a microphone that produces no audio frames fails promptly and releases capture',async()=>{
 const nav=Object.getOwnPropertyDescriptor(global,'navigator'),oldAudio=global.AudioContext,oldWindow=global.window;let watchdog,stopped=0,closed=0;
 const node={connect(){},disconnect(){}};
 Object.defineProperty(global,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stopped++;}}]})}}});
 global.window={setTimeout(callback,ms){if(ms===4000)watchdog=callback;return 1;},clearTimeout(){}};
 global.AudioContext=class{sampleRate=48000;state='running';createMediaStreamSource(){return node;}createScriptProcessor(){return {...node};}createGain(){return {...node,gain:{value:1}};}async resume(){}async close(){closed++;this.state='closed';}};
 try{const recording=recordConversationTurn(new AbortController().signal,()=>{});await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof watchdog,'function');watchdog();await assert.rejects(recording,/no audio is arriving/);assert.equal(stopped,1);assert.equal(closed,1);}finally{Object.defineProperty(global,'navigator',nav);global.AudioContext=oldAudio;global.window=oldWindow;}
});
