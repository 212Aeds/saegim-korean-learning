const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;delete process.env.NEXT_PUBLIC_PRERECORDED_AUDIO;
const {playElevenLabsKorean,stopKoreanPlayback}=require('../apps/web/app/ui/speech.ts');
test('listening refuses device synthesis even when a Korean system voice is available',async()=>{
 const oldWindow=global.window,oldUtterance=global.SpeechSynthesisUtterance;
 let calls=0;
 global.SpeechSynthesisUtterance=class {constructor(){calls++;}};
 global.window={setTimeout,clearTimeout,SpeechSynthesisUtterance:global.SpeechSynthesisUtterance,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){},getVoices(){calls++;return [{name:'Korean',voiceURI:'ko',lang:'ko-KR',localService:true}];},speak(){calls++;}}};
 try {
   for(const voice of ['chris','jessica'])assert.deepEqual(await playElevenLabsKorean('집',voice,0.8,{waitForEnd:true}),{played:false,source:'unavailable'});
   assert.equal(calls,0);
 } finally {stopKoreanPlayback();global.window=oldWindow;global.SpeechSynthesisUtterance=oldUtterance;}
});
