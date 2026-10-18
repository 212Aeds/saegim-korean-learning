const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {encodeWav}=require('../apps/web/app/ui/openrouter-audio-capture.ts');
const {recordConversationTurn}=require('../apps/web/app/ui/conversation-recording.ts');
test('hardware-rate recordings become mono 16k PCM without changing duration',()=>{
 for(const rate of [16000,44100,48000]){
 const samples=new Float32Array(rate/2).fill(.1),wav=encodeWav({context:{sampleRate:rate},samples:samples.length,chunks:[samples]});
 const view=new DataView(wav);assert.equal(view.getUint32(24,true),16000);assert.equal(view.getUint32(28,true),32000);assert.ok(Math.abs(view.getUint32(40,true)/2/16000-.5)<.001);assert.equal(view.getUint16(22,true),1);
 }
});
test('canceling an unanswered permission request settles immediately and releases a late microphone',async()=>{
 const nav=Object.getOwnPropertyDescriptor(global,'navigator');let resolveMic,stopped=0;
 Object.defineProperty(global,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:()=>new Promise(resolve=>resolveMic=resolve)}}});
 try{const controller=new AbortController(),recording=recordConversationTurn(controller.signal,()=>{});controller.abort();const result=await Promise.race([recording.then(()=>false,e=>e.name==='AbortError'),new Promise(resolve=>setTimeout(()=>resolve(false),40))]);assert.equal(result,true);resolveMic({getTracks:()=>[{stop(){stopped++;}}]});await new Promise(resolve=>setImmediate(resolve));assert.equal(stopped,1);}finally{if(nav)Object.defineProperty(global,'navigator',nav);else delete global.navigator;}
});

test('an unsupported requested sample rate falls back to hardware and still releases it on cancellation',async()=>{
 const nav=Object.getOwnPropertyDescriptor(global,'navigator'),oldWindow=global.window,oldAudio=global.AudioContext;let stopped=0,closed=0,finish,created=0;
 Object.defineProperty(global,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stopped++;}}]})}}});
 const node={connect(){},disconnect(){}};global.window={setTimeout,clearTimeout};
 global.AudioContext=class{constructor(options){created++;if(options)throw new DOMException('unsupported rate','NotSupportedError');}sampleRate=48000;state='running';createMediaStreamSource(){return node;}createScriptProcessor(){return {...node,onaudioprocess:null};}createGain(){return {...node,gain:{value:1}};}resume(){return Promise.resolve();}async close(){closed++;this.state='closed';}};
 try{const controller=new AbortController(),recording=recordConversationTurn(controller.signal,()=>{},{onReady:ready=>finish=ready});await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof finish,'function');controller.abort();await assert.rejects(recording,{name:'AbortError'});assert.equal(created,2);assert.equal(stopped,1);assert.equal(closed,1);assert.equal(finish,null);}finally{if(nav)Object.defineProperty(global,'navigator',nav);else delete global.navigator;global.window=oldWindow;global.AudioContext=oldAudio;}
});
