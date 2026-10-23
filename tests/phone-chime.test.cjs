const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {playCorrectAnswerSound,unlockPracticeSounds,feedbackSoundBlocked}=require('../apps/web/app/ui/feedback-sound.ts');
test('phone chimes use the unlocked native player even if a Web Audio resume would never finish',async()=>{
 const old={window:global.window,Audio:global.Audio,AudioContext:global.AudioContext};let plays=0,contexts=0,fail=false;
 global.window={localStorage:{getItem:()=>null}};global.AudioContext=class{constructor(){contexts++;}resume(){return new Promise(()=>{});}};global.Audio=class{constructor(src){this.src=src;}pause(){}play(){plays++;return fail?Promise.reject(new DOMException('blocked','NotAllowedError')):Promise.resolve();}};
 try{unlockPracticeSounds();playCorrectAnswerSound();await new Promise(r=>setImmediate(r));assert.equal(plays,2);assert.equal(contexts,0);fail=true;playCorrectAnswerSound();await new Promise(r=>setImmediate(r));assert.equal(feedbackSoundBlocked(),true);fail=false;playCorrectAnswerSound();await new Promise(r=>setImmediate(r));assert.equal(feedbackSoundBlocked(),false);}finally{Object.assign(global,old);}
});
