const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
test('practice ding reuses one native player across repeated taps and recovers after a rejected play',async()=>{
 const old={window:global.window,Audio:global.Audio};let created=0,plays=0,muted=false,reject=false,pauses=0;
 global.window={localStorage:{getItem:()=>muted?'true':null}};global.Audio=class{constructor(src){created++;this.src=src;}pause(){pauses++;}play(){plays++;return reject?Promise.reject(new DOMException('Blocked','NotAllowedError')):Promise.resolve();}};
 try{const {playCorrectAnswerSound}=require('../apps/web/app/ui/feedback-sound.ts');for(let i=0;i<10;i++)playCorrectAnswerSound();assert.equal(created,1);assert.equal(plays,10);reject=true;playCorrectAnswerSound();await new Promise(r=>setImmediate(r));reject=false;playCorrectAnswerSound();assert.equal(plays,12);muted=true;playCorrectAnswerSound();assert.equal(plays,12);assert.ok(pauses>=10);}finally{Object.assign(global,old);}
});
test('a delayed unlock completion cannot pause a later correct ding',async()=>{
 delete require.cache[require.resolve('../apps/web/app/ui/feedback-sound.ts')];const old={window:global.window,Audio:global.Audio};let finish,pauses=0,audio;
 global.window={localStorage:{getItem:()=>null}};global.Audio=class{constructor(){audio=this;}pause(){pauses++;}play(){return this.src.startsWith('data:')?new Promise(r=>finish=r):Promise.resolve();}};
 try{const {unlockPracticeSounds,playCorrectAnswerSound}=require('../apps/web/app/ui/feedback-sound.ts');unlockPracticeSounds();playCorrectAnswerSound();const before=pauses;finish();await new Promise(r=>setImmediate(r));assert.equal(pauses,before);assert.equal(audio.src,'/audio/feedback/correct.wav');}finally{Object.assign(global,old);}
});


test('feedback clip is a short valid recording, and preload never plays sound',()=>{
 const {auditWav}=require('../scripts/check-lesson-audio.cjs');const bytes=fs.readFileSync('apps/web/public/audio/feedback/correct.wav');assert.doesNotThrow(()=>auditWav(bytes));assert.ok(bytes.length<24000);
 delete require.cache[require.resolve('../apps/web/app/ui/feedback-sound.ts')];const old={window:global.window,Audio:global.Audio};let created=0;
 global.window={localStorage:{getItem:()=>null}};global.Audio=class{constructor(){created++;}play(){throw Error('preload must not play');}};
 try{require('../apps/web/app/ui/feedback-sound.ts').preparePracticeSounds();assert.equal(created,1);}finally{Object.assign(global,old);}
});
