const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,p);
process.env.NEXT_PUBLIC_FREE_PUBLISHING='false';process.env.NEXT_PUBLIC_HOSTED_AI_ENABLED='true';process.env.NEXT_PUBLIC_API_URL='/api';process.env.NEXT_PUBLIC_PRERECORDED_AUDIO='true';process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;
const {localSpeechAvailable}=require('../apps/web/app/ui/local-speech-server.ts');
test('overlapping availability checks share one request, success is briefly reused, and retry bypasses the cache',async()=>{
 const original=global.fetch,clock=Date.now;let resolve,calls=0,now=100000;
 try{Date.now=()=>now;global.fetch=()=>{calls++;return new Promise(done=>resolve=done);};
 const first=localSpeechAvailable(),second=localSpeechAvailable();assert.equal(calls,1);
 resolve(new Response(JSON.stringify({transcription:true})));assert.deepEqual(await Promise.all([first,second]),[true,true]);
 assert.equal(await localSpeechAvailable(),true);assert.equal(calls,1);
 global.fetch=async()=>{calls++;return new Response('{}',{status:503});};assert.equal(await localSpeechAvailable(true),false);assert.equal(calls,2);
 global.fetch=async()=>{calls++;return new Response(JSON.stringify({transcription:true}));};assert.equal(await localSpeechAvailable(),true);assert.equal(calls,3);
 now+=15001;assert.equal(await localSpeechAvailable(),true);assert.equal(calls,4);
 }finally{global.fetch=original;Date.now=clock;}
});
test('preparing a new recorded clip does not wait for an unrelated stalled download',async()=>{
 const {prefetchLocalKorean}=require('../apps/web/app/ui/speech.ts');
 const keys=Object.keys(require('../apps/web/app/audio-manifest.json')).filter(key=>key.startsWith('chris|')).slice(0,2);
 const original=global.fetch,windowBefore=global.window;let release,calls=0;
 const response=()=>new Response(new Blob(['synthetic audio'],{type:'audio/wav'}),{headers:{'Content-Type':'audio/wav'}});
 try{global.window={};global.fetch=()=>{calls++;return calls===1?new Promise(resolve=>release=resolve):Promise.resolve(response());};
 const first=prefetchLocalKorean(keys[0].split('|')[1],'chris');await new Promise(setImmediate);
 const second=prefetchLocalKorean(keys[1].split('|')[1],'chris');await new Promise(setImmediate);assert.equal(calls,2);
 await second;release(response());await first;
 }finally{if(release)release(response());global.fetch=original;if(windowBefore===undefined)delete global.window;else global.window=windowBefore;}
});

test('canceled transcription skips reading audio and uploading; cancel during file read skips decoding',async()=>{
 const {transcribeOnLocalServer}=require('../apps/web/app/ui/local-speech-server.ts');
 const original=global.fetch;let reads=0,requests=0;
 try{global.fetch=async()=>{requests++;throw Error('Unexpected upload');};
 const stopped=new AbortController();stopped.abort();
 await assert.rejects(transcribeOnLocalServer({arrayBuffer:async()=>{reads++;return new ArrayBuffer(0);}},stopped.signal),{name:'AbortError'});
 assert.equal(reads,0);assert.equal(requests,0);
 const duringRead=new AbortController();
 await assert.rejects(transcribeOnLocalServer({arrayBuffer:async()=>{reads++;duringRead.abort();return new ArrayBuffer(0);}},duringRead.signal),{name:'AbortError'});
 assert.equal(reads,1);assert.equal(requests,0);
 }finally{global.fetch=original;}
});
