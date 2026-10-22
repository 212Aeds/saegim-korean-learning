const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
test('matching voices share initialization and release canceled generation',async()=>{
 const previous={window:global.window,Worker:global.Worker};let workers=[];const storage=new Map();
 global.window={localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}};
 global.Worker=class{constructor(url,options){assert.equal(url,'/voices/worker.js');assert.equal(options.type,'module');workers.push(this);this.messages=[];}postMessage(message){this.messages.push(message);}terminate(){this.terminated=true;}reply(type,extra={}){this.onmessage({data:{id:this.messages.at(-1).id,type,...extra}});}};
 const voices=require('../apps/web/app/ui/browser-voices.ts');
 try{
  assert.equal(workers.length,0);assert.equal(voices.browserVoicesConsented(),false);
  const first=voices.enableBrowserVoices(),second=voices.enableBrowserVoices();assert.equal(first,second);assert.equal(workers.length,1);assert.equal(voices.browserVoicesConsented(),true);
  workers[0].reply('ready');await first;assert.equal(voices.browserVoiceState().phase,'ready');
  const abort=new AbortController(),audio=voices.synthesizeBrowserVoice('안녕하세요.','chris',abort.signal);
  assert.equal(workers[0].messages.at(-1).voice,'chris');abort.abort();await assert.rejects(audio,error=>error.name==='AbortError');assert.equal(workers[0].terminated,true);assert.equal(voices.browserVoiceState().phase,'idle');
  const retry=voices.enableBrowserVoices();
  workers[0].onmessage({data:{type:'progress',progress:99,message:'Old download'}});assert.equal(voices.browserVoiceState().progress,0);
  workers[0].onerror();assert.equal(workers[1].terminated,undefined);assert.equal(voices.browserVoiceState().phase,'loading');
  workers[1].reply('ready');await retry;
  const generated=voices.synthesizeBrowserVoice('반가워요.','jessica',new AbortController().signal);workers[1].reply('audio',{wav:new ArrayBuffer(48)});const firstClip=await generated;assert.equal(firstClip.type,'audio/wav');const sent=workers[1].messages.length;assert.equal(await voices.synthesizeBrowserVoice('반가워요.','jessica',new AbortController().signal),firstClip);assert.equal(workers[1].messages.length,sent);
  const failed=voices.synthesizeBrowserVoice('새로운 문장이에요.','chris',new AbortController().signal);workers[1].reply('error',{message:'Synthetic model failure'});await assert.rejects(failed,/Synthetic model failure/);assert.equal(workers[1].terminated,true);
  workers[1].onerror();assert.equal(voices.browserVoiceState().phase,'error');assert.equal(workers[1].terminated,true);
  voices.forgetBrowserVoiceConsent();assert.equal(voices.browserVoicesConsented(),false);assert.equal(voices.browserVoiceState().phase,'idle');
 }finally{voices.cancelBrowserVoices();Object.assign(global,previous);}
});
test('matching voice manifest pins the same M1/F1 model files and SHA-256 identities',()=>{
 const manifest=require('../apps/web/public/voices/model-manifest.json');
 assert.equal(manifest.revision,'3cadd1ee6394adea1bd021217a0e650ede09a323');
 for(const path of ['voice_styles/M1.json','voice_styles/F1.json','onnx/vector_estimator.onnx','onnx/vocoder.onnx']){assert.ok(manifest.files[path].bytes>0);assert.match(manifest.files[path].sha256,/^[a-f0-9]{64}$/);}
 assert.ok(Object.values(manifest.files).reduce((sum,file)=>sum+file.bytes,0)<410_000_000);
});
test('hosted conversation playback uses the model and never substitutes a device voice',async()=>{
 process.env.NEXT_PUBLIC_HOSTED_AI_ENABLED='true';process.env.NEXT_PUBLIC_FREE_PUBLISHING='false';process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL='';process.env.NEXT_PUBLIC_PRERECORDED_AUDIO='true';
 const previous={window:global.window,Worker:global.Worker,Audio:global.Audio};let current,deviceCalls=0;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem:()=>{}},speechSynthesis:{cancel(){},getVoices(){deviceCalls++;return[];}}};
 global.Worker=class{constructor(){current=this;}postMessage(data){queueMicrotask(()=>this.onmessage({data:{id:data.id,type:data.type==='initialize'?'ready':'audio',...(data.type==='synthesize'?{wav:new ArrayBuffer(100)}:{})}}));}terminate(){}};
 global.Audio=class{constructor(src){this.src=src;}pause(){}play(){queueMicrotask(()=>this.onended?.());return Promise.resolve();}};
 const voices=require('../apps/web/app/ui/browser-voices.ts'),speech=require('../apps/web/app/ui/speech.ts');
 try{
  assert.equal(await speech.koreanConversationAudioAvailable(),false);
  assert.equal((await speech.playElevenLabsKorean('한국어로 같이 이야기해요.','chris',1,{conversationVoice:true,consistentVoice:true})).source,'browser-model');
  assert.equal(deviceCalls,0);await voices.enableBrowserVoices();assert.equal(await speech.koreanConversationAudioAvailable(),true);
  let started=0;const result=await speech.playElevenLabsKorean('한국어로 같이 이야기해요.','jessica',1,{waitForEnd:true,onPlaybackStart:()=>started++});assert.equal(started,1);assert.equal(result.source,'browser-model');assert.equal(result.played,true);assert.equal(deviceCalls,0);
  voices.cancelBrowserVoices();const canceled=speech.playElevenLabsKorean('새로운 대화예요.','chris');speech.stopKoreanPlayback();assert.equal((await canceled).played,false);assert.equal(deviceCalls,0);
 }finally{speech.stopKoreanPlayback();voices.cancelBrowserVoices();Object.assign(global,previous);}
});

test('conversation audio preparation and Listen share one synthesis and retry after cancellation',async()=>{
 const previous={window:global.window,Worker:global.Worker};let worker;
 global.window={localStorage:{getItem:()=>null,setItem:()=>{}}};
 global.Worker=class{constructor(){worker=this;this.messages=[];}postMessage(message){this.messages.push(message);}terminate(){}reply(type,extra={}){this.onmessage({data:{id:this.messages.at(-1).id,type,...extra}});}};
 const voices=require('../apps/web/app/ui/browser-voices.ts');
 try{
  const init=voices.enableBrowserVoices();worker.reply('ready');await init;
  const first=voices.synthesizeBrowserVoice('같이 이야기해요.','jessica',new AbortController().signal);
  const second=voices.synthesizeBrowserVoice('같이 이야기해요.','jessica',new AbortController().signal);
  assert.equal(worker.messages.filter(m=>m.type==='synthesize').length,1);
  worker.reply('audio',{wav:new ArrayBuffer(80)});assert.equal(await first,await second);
  const abort=new AbortController();const preparing=voices.synthesizeBrowserVoice('다른 대화예요.','chris',abort.signal);
  const joined=voices.synthesizeBrowserVoice('다른 대화예요.','chris',new AbortController().signal);
  abort.abort();await assert.rejects(preparing);await assert.rejects(joined);
  const retry=voices.enableBrowserVoices();worker.reply('ready');await retry;
  const clip=voices.synthesizeBrowserVoice('다른 대화예요.','chris',new AbortController().signal);worker.reply('audio',{wav:new ArrayBuffer(80)});assert.ok(await clip);
 }finally{voices.cancelBrowserVoices();Object.assign(global,previous);}
});

test('visible conversation prefetch never initializes a model and a later Listen reuses its clip',async()=>{
 const previous={window:global.window,Worker:global.Worker};let worker;
 global.window={localStorage:{getItem:()=>null,setItem:()=>{}}};
 global.Worker=class{constructor(){worker=this;this.messages=[];}postMessage(message){this.messages.push(message);}terminate(){}reply(type,extra={}){this.onmessage({data:{id:this.messages.at(-1).id,type,...extra}});}};
 const voices=require('../apps/web/app/ui/browser-voices.ts'),speech=require('../apps/web/app/ui/speech.ts');
 try{
  await speech.prefetchConversationKorean('처음 보는 대화 문장이에요.','jessica');assert.equal(worker,undefined);
  const init=voices.enableBrowserVoices();worker.reply('ready');await init;
  const prepared=speech.prefetchConversationKorean('처음 보는 대화 문장이에요.','jessica');
  const listening=voices.synthesizeBrowserVoice('처음 보는 대화 문장이에요.','jessica',new AbortController().signal);
  assert.equal(worker.messages.filter(m=>m.type==='synthesize').length,1);
  worker.reply('audio',{wav:new ArrayBuffer(80)});await prepared;const clip=await listening;
  assert.equal(voices.cachedBrowserVoice('처음 보는 대화 문장이에요.','jessica'),clip);
 }finally{voices.cancelBrowserVoices();Object.assign(global,previous);}
});

test('generated voice cache has a byte budget as well as a clip-count limit',async()=>{
 const previous={window:global.window,Worker:global.Worker};let worker;
 global.window={localStorage:{getItem:()=>null,setItem:()=>{}}};
 global.Worker=class{constructor(){worker=this;this.messages=[];}postMessage(message){this.messages.push(message);}terminate(){}reply(type,extra={}){this.onmessage({data:{id:this.messages.at(-1).id,type,...extra}});}};
 const voices=require('../apps/web/app/ui/browser-voices.ts');
 try{
  const init=voices.enableBrowserVoices();worker.reply('ready');await init;
  for(const text of ['first','second','third']){const result=voices.synthesizeBrowserVoice(text,'jessica',new AbortController().signal);worker.reply('audio',{wav:new ArrayBuffer(3*1024*1024)});await result;}
  assert.equal(voices.cachedBrowserVoice('first','jessica'),undefined);
  assert.ok(voices.cachedBrowserVoice('second','jessica'));assert.ok(voices.cachedBrowserVoice('third','jessica'));
  const large=voices.synthesizeBrowserVoice('oversized','chris',new AbortController().signal);worker.reply('audio',{wav:new ArrayBuffer(9*1024*1024)});assert.equal((await large).size,9*1024*1024);
  assert.equal(voices.cachedBrowserVoice('oversized','chris'),undefined);
 }finally{voices.cancelBrowserVoices();Object.assign(global,previous);}
});
