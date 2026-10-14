const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;delete process.env.NEXT_PUBLIC_PRERECORDED_AUDIO;
const {playElevenLabsKorean,stopKoreanPlayback}=require('../apps/web/app/ui/speech.ts');
test('device audio waits for the utterance to finish and Stop resolves an active wait',async()=>{
 const oldWindow=global.window,oldUtterance=global.SpeechSynthesisUtterance;
 let utterance,started;
 global.SpeechSynthesisUtterance=class {constructor(text){this.text=text;utterance=this;}};
 global.window={setTimeout,clearTimeout,SpeechSynthesisUtterance:global.SpeechSynthesisUtterance,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){},getVoices:()=>[{name:'Korean',voiceURI:'ko',lang:'ko-KR',localService:true}],speak(){started?.();}}};
 try {
   let finished=false;
   const playing=new Promise(resolve=>{started=resolve;});
   const result=playElevenLabsKorean('집','jessica',0.8,{waitForEnd:true}).then(value=>{finished=true;return value;});
   await playing;assert.equal(finished,false);assert.equal(utterance.rate,0.8);utterance.onend();assert.equal((await result).played,true);
   const nextPlaying=new Promise(resolve=>{started=resolve;});
   const next=playElevenLabsKorean('집','chris',1,{waitForEnd:true});await nextPlaying;stopKoreanPlayback();assert.equal((await next).played,false);
 } finally {stopKoreanPlayback();global.window=oldWindow;global.SpeechSynthesisUtterance=oldUtterance;}
});
