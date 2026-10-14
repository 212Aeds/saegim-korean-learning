const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
process.env.NEXT_PUBLIC_PRERECORDED_AUDIO='true';delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';
const {recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');
test('recorded letter names resolve by selected voice and point to real WAV files',()=>{
 const {hangulLetters}=require('../apps/web/app/more-lessons.ts');
 for(const letter of hangulLetters)for(const voice of ['chris','jessica']){
  const url=recordedAudioUrl(letter.korean,voice);assert.match(url,/^\/audio\/lessons\/[a-f0-9]{64}\.wav$/);
  const bytes=fs.readFileSync(require('node:path').join(__dirname,'../apps/web/public',url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.ok(bytes.length>44);
 }
 assert.notEqual(recordedAudioUrl('ㄱ','chris'),recordedAudioUrl('ㄱ','jessica'));assert.equal(recordedAudioUrl('not a saved phrase','chris'),undefined);
});
test('recorded playback needs no speech server or paid provider and retains pace',async()=>{
 const oldFetch=global.fetch,oldWindow=global.window,oldAudio=global.Audio;let audio,calls=[];
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){}}};
 global.Audio=class{constructor(){audio=this;}async play(){}pause(){}};
 global.fetch=async(url,options)=>{calls.push(url);assert.ok(url.startsWith('/audio/lessons/'));assert.equal(options.method,undefined);return {ok:true,headers:new Headers({'content-type':'audio/wav'}),blob:async()=>new Blob(['audio'])};};
 const {playElevenLabsKorean,stopKoreanPlayback}=require('../apps/web/app/ui/speech.ts');
 try{assert.equal((await playElevenLabsKorean('ㄱ','chris',1.2)).source,'catalog');assert.equal(audio.playbackRate,1.2);assert.equal(calls.length,1);}finally{stopKoreanPlayback();global.fetch=oldFetch;global.window=oldWindow;global.Audio=oldAudio;}
});
