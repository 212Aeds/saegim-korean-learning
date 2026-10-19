const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {playCorrectAnswerSound,unlockPracticeSounds}=require('../apps/web/app/ui/feedback-sound.ts');
test('phone chimes wait for audio resume and can be unlocked before async speech results',async()=>{
 const oldWindow=global.window,oldAudio=global.AudioContext;let release,tones=0,resumes=0,context;
 class PhoneAudio{constructor(){context=this;}state='suspended';currentTime=0;destination={};resume(){resumes++;return new Promise(resolve=>{release=()=>{this.state='running';resolve();}});}createOscillator(){return {frequency:{value:0},connect(){},start(){tones++;},stop(){}};}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}
 global.window={AudioContext:PhoneAudio,localStorage:{getItem:()=>null}};global.AudioContext=PhoneAudio;
 try{unlockPracticeSounds();assert.equal(resumes,1);playCorrectAnswerSound();assert.equal(tones,0);release();await new Promise(resolve=>setImmediate(resolve));assert.equal(tones,2);assert.equal(context.state,'running');}finally{global.window=oldWindow;global.AudioContext=oldAudio;}
});
