const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
Object.assign(process.env,{NEXT_PUBLIC_PRERECORDED_AUDIO:'true',NEXT_PUBLIC_PAID_FEATURES_ENABLED:'false'});delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;
const {playElevenLabsKorean,stopKoreanPlayback}=require('../apps/web/app/ui/speech.ts');
function setup(Audio){const old={window:global.window,Audio:global.Audio};global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){}}};global.Audio=Audio;return ()=>{stopKoreanPlayback();global.window=old.window;global.Audio=old.Audio;};}
test('every level card plays its selected packaged voice and releases playback on completion',async()=>{
 const {speakingCardsForProfile}=require('../apps/web/app/speak-cards.ts'),{lessons}=require('../apps/web/app/curriculum.ts'),{recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');let audio;
 const restore=setup(class{constructor(url){audio=this;this.src=url;}play(){queueMicrotask(()=>this.onended());return Promise.resolve();}pause(){}});
 try{for(const level of ['new','hangul','basic','intermediate','advanced'])for(const done of [[],lessons.map(l=>l.id)])for(const c of speakingCardsForProfile({level,reasons:['family','travel','food','living','culture','friends','exams','work-study']},done))for(const voice of ['chris','jessica']){
 const result=await playElevenLabsKorean(c.korean,voice,1,{waitForEnd:true});assert.equal(result.played,true,`${level}: ${voice}: ${c.korean}`);assert.equal(audio.src,recordedAudioUrl(c.korean,voice));assert.equal(audio.playbackRate,1);
 }}finally{restore();}
});
test('stopping while a browser play promise is stalled releases the caller and allows the next card',async()=>{
 let count=0;
 const restore=setup(class{play(){if(count++===0)return new Promise(()=>{});queueMicrotask(()=>this.onended());return Promise.resolve();}pause(){}});
 try{const stalled=playElevenLabsKorean('딸','chris',1,{waitForEnd:true});stopKoreanPlayback();assert.equal(await Promise.race([stalled.then(r=>r.played),new Promise(resolve=>setTimeout(()=>resolve('stuck'),30))]),false);
 assert.equal((await playElevenLabsKorean('거실','jessica',1,{waitForEnd:true})).played,true);
 }finally{restore();}
});
test('a playback startup timeout releases a stalled Listen instead of blocking Speak',async()=>{
 const restore=setup(class{play(){return new Promise(()=>{});}pause(){}});let expire;
 global.window.setTimeout=(fn,ms)=>{if(ms===20000){expire=fn;return 0;}return setTimeout(fn,ms);};
 try{const stalled=playElevenLabsKorean('딸','jessica',1,{waitForEnd:true});expire();assert.equal(await Promise.race([stalled.then(r=>r.played),new Promise(resolve=>setTimeout(()=>resolve('stuck'),30))]),false);}finally{restore();}
});

test('a media error during pending startup releases Listen and a later card can retry',async()=>{
 let audio;
 const restore=setup(class{constructor(){audio=this;}play(){return new Promise(()=>{});}pause(){}});
 try{const stalled=playElevenLabsKorean('딸','chris',1,{waitForEnd:true});audio.onerror();assert.equal(await Promise.race([stalled.then(r=>r.played),new Promise(resolve=>setTimeout(()=>resolve('stuck'),30))]),false);}finally{restore();}
});
