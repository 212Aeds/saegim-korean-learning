const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {voicePreparationPolicy}=require('../apps/web/app/ui/voice-device-policy.ts');
test('constrained phone initialization creates no worker and leaves the page usable',async()=>{
 const nav=Object.getOwnPropertyDescriptor(global,'navigator'),oldWorker=global.Worker;let created=0;
 Object.defineProperty(global,'navigator',{configurable:true,value:{userAgent:'iPhone',deviceMemory:2,connection:{type:'cellular'}}});
 global.Worker=class{constructor(){created++;throw Error('Unexpected heavy model startup');}};
 const voices=require('../apps/web/app/ui/browser-voices.ts');
 try{await voices.prepareBrowserVoicesAutomatically();assert.equal(created,0);assert.equal(voices.browserVoiceState().phase,'idle');await assert.rejects(voices.enableBrowserVoices(),/reduce crash risk/);assert.equal(created,0);assert.equal(voices.browserVoiceState().phase,'error');assert.match(voices.browserVoiceState().message,/Recorded Chris/);}
 finally{voices.cancelBrowserVoices();if(nav)Object.defineProperty(global,'navigator',nav);else delete global.navigator;global.Worker=oldWorker;}
});
test('phone and constrained network hints never trigger a large automatic model load',()=>{
 for(const hints of [{mobile:true,memoryGB:8,gpu:true},{saveData:true},{connectionType:'cellular'},{effectiveType:'3g'},{effectiveType:'2g'}])assert.equal(voicePreparationPolicy(hints).automatic,false);
 assert.deepEqual([voicePreparationPolicy({memoryGB:8,gpu:true}).canLoad,voicePreparationPolicy({memoryGB:8,gpu:true}).automatic],[true,true]);
 for(const hints of [{memoryGB:2},{memoryGB:4},{mobile:true,memoryGB:2}]){const result=voicePreparationPolicy(hints);assert.equal(result.canLoad,false);assert.match(result.reason,/Recorded Chris\/Jessica audio and microphone/);}
 assert.equal(voicePreparationPolicy({mobile:true,gpu:true}).canLoad,true,'Phones select the compact model even when memory hints are unavailable');
 assert.equal(voicePreparationPolicy({mobile:true,gpu:true,memoryGB:8}).canLoad,true);
});
test('streamed voice downloads preserve exact bytes and reject interrupted or oversized streams',async()=>{
 const source=fs.readFileSync('apps/web/public/voices/read-asset.js','utf8');
 const {readVoiceAsset}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const response=parts=>new Response(new ReadableStream({start(controller){for(const part of parts)controller.enqueue(Uint8Array.from(part));controller.close();}}));
 let progress=0;const output=await readVoiceAsset(response([[1,2],[3],[4,5]]),5,count=>progress+=count);
 assert.deepEqual([...new Uint8Array(output)],[1,2,3,4,5]);assert.equal(progress,5);
 await assert.rejects(readVoiceAsset(response([[1,2]]),3),/interrupted/);
 await assert.rejects(readVoiceAsset(response([[1,2,3]]),2),/size did not match/);
 await assert.rejects(readVoiceAsset(response([]),500_000_000),/Invalid voice file size/);
 const broken=new Response(new ReadableStream({pull(controller){controller.error(new Error('Synthetic cellular disconnect'));}}));
 await assert.rejects(readVoiceAsset(broken,2),/cellular disconnect/);
});
test('the conversation action is usable before voice readiness and has a speak-and-read path',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8');
 assert.doesNotMatch(ui,/disabled=\{thinking \|\| playing \|\| !apiUrl \|\| !voiceReady\}/);
 assert.match(ui,/Start speak-and-read conversation/);assert.match(ui,/if\(browserVoices&&useVoiceReplies\)await enableBrowserVoices/);
 assert.match(ui,/const playback = useVoiceReplies \?/);
});

test('conversation Listen primes the audio element before awaiting synthesis and labels blocked novel audio',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8');
 const listen=ui.slice(ui.indexOf('  async function listen('),ui.indexOf('  async function replyTo('));
 assert.ok(listen.indexOf('primeBrowserVoicePlayback()')<listen.indexOf('await playElevenLabsKorean'));
 assert.match(ui,/recordedAudioEnabled && recordedAudioUrl\(text,partner\)/);
 assert.match(ui,/Audio unavailable on this device/);
 const css=fs.readFileSync('apps/web/app/globals.css','utf8');
 assert.match(css,/\.conversation-card button,\.conversation-card summary\{min-height:44px;touch-action:manipulation;/);
});

test('unknown-memory iPhones use a smaller explicit preparation profile without automatic downloads',()=>{
 const result=voicePreparationPolicy({mobile:true,gpu:false});
 assert.equal(result.profile,'mobile');assert.equal(result.canLoad,true);assert.equal(result.automatic,false);assert.match(result.reason,/prepare in the background/);
 const manifest=require('../apps/web/public/voices/mobile-model-manifest.json');
 assert.match(manifest.revision,/^[a-f0-9]{40}$/);assert.equal(manifest.variant,'mixed-fast');
 assert.ok(Object.values(manifest.files).reduce((n,f)=>n+f.bytes,0)<110_000_000);
 const original=require('../apps/web/public/voices/model-manifest.json');
 for(const name of ['voice_styles/M1.json','voice_styles/F1.json','onnx/tts.json','onnx/unicode_indexer.json'])assert.equal(manifest.files[name].sha256,original.files[name].sha256);
});

test('an explicit iPhone setup forwards the compact profile to the worker',async()=>{
 const nav=Object.getOwnPropertyDescriptor(global,'navigator'),oldWorker=global.Worker,oldWindow=global.window;let worker;
 Object.defineProperty(global,'navigator',{configurable:true,value:{userAgent:'iPhone',platform:'iPhone',maxTouchPoints:5}});
 global.window={localStorage:{setItem(){}}};global.Worker=class{constructor(){worker=this;}postMessage(message){this.message=message;}terminate(){}};
 const voices=require('../apps/web/app/ui/browser-voices.ts');
 try{await voices.prepareBrowserVoicesAutomatically();assert.equal(worker,undefined);const setup=voices.enableBrowserVoices();assert.equal(worker.message.profile,'mobile');worker.onmessage({data:{id:worker.message.id,type:'ready'}});await setup;assert.equal(voices.browserVoiceState().phase,'ready');}
 finally{voices.cancelBrowserVoices();if(nav)Object.defineProperty(global,'navigator',nav);else delete global.navigator;global.Worker=oldWorker;global.window=oldWindow;}
});

test('read-aloud can prepare voices and setup does not wait for unused warm-up audio',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8'),worker=fs.readFileSync('apps/web/public/voices/worker.js','utf8');
 assert.doesNotMatch(ui,/checked=\{speakReplies\} disabled=\{!voiceReady\}/);
 assert.match(ui,/async function toggleReadAloud/);
 const initialize=worker.slice(worker.indexOf('async function initialize('),worker.indexOf('function finish('));
 assert.doesNotMatch(initialize,/await engine.call/);
});

test('home startup does not prepare the conversation model, and read-aloud has a full touch control',()=>{
 const page=fs.readFileSync('apps/web/app/page.tsx','utf8'),ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8'),worker=fs.readFileSync('apps/web/public/voices/worker.js','utf8');
 assert.doesNotMatch(page,/prepareBrowserVoicesAutomatically/);
 assert.match(ui,/role="switch" aria-checked=\{speakReplies\}/);
 assert.match(ui,/audio.controls=false/);assert.match(ui,/ref=\{audioHost\} hidden aria-hidden="true"/);assert.match(ui,/Tap Listen again to play it/);assert.doesNotMatch(ui,/If automatic playback is blocked|Tap Play in the audio player/);assert.match(ui,/aria-label","Conversation audio/);
 assert.match(worker,/engine.call\(text,'ko',styles\[data.voice\],8,/);
});
