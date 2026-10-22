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
 for(const hints of [{memoryGB:2},{memoryGB:4},{mobile:true,gpu:false}]){const result=voicePreparationPolicy(hints);assert.equal(result.canLoad,false);assert.match(result.reason,/Recorded Chris\/Jessica audio and microphone/);}
 assert.equal(voicePreparationPolicy({mobile:true,gpu:true}).canLoad,false,'GPU availability does not establish enough phone memory');
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
