const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
process.env.NEXT_PUBLIC_HOSTED_AI_ENABLED='true';process.env.NEXT_PUBLIC_FREE_PUBLISHING='false';process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;delete process.env.NEXT_PUBLIC_PRERECORDED_AUDIO;
const speech=require('../apps/web/app/ui/speech.ts');
test('hosted speech can use a browser-provided Korean voice while preferring installed voices',()=>{
 const original=global.window;
 const installed={name:'Installed Korean',voiceURI:'ko-local',lang:'ko-KR',localService:true};
 const browser={name:'Browser Korean',voiceURI:'ko-browser',lang:'ko-KR',localService:false};
 global.window={speechSynthesis:{getVoices:()=>[browser,{name:'English',lang:'en-US',localService:true},installed]}};
 try{assert.deepEqual(speech.listKoreanVoices(),[installed,browser]);}finally{global.window=original;}
});
test('an explicitly selected Korean voice takes precedence over the default voice name',()=>{
 const original=global.window,oldUtterance=global.SpeechSynthesisUtterance;let spoken;
 global.SpeechSynthesisUtterance=class{constructor(text){this.text=text;spoken=this;}};
 const voices=[{name:'Yuna',voiceURI:'ko-default',lang:'ko-KR',localService:true},{name:'Other Korean',voiceURI:'ko-selected',lang:'ko-KR',localService:true}];
 global.window={SpeechSynthesisUtterance:global.SpeechSynthesisUtterance,localStorage:{getItem:()=>null},setTimeout:()=>1,clearTimeout(){},speechSynthesis:{getVoices:()=>voices,cancel(){}}};
 try{assert.equal(speech.previewKoreanVoice('안녕하세요','ko-selected',0.85),true);assert.equal(spoken.voice.voiceURI,'ko-selected');assert.equal(spoken.rate,0.85);}finally{speech.stopKoreanPlayback();global.window=original;global.SpeechSynthesisUtterance=oldUtterance;}
});
test('conversation readiness reports missing speech without sending an AI or audio request',async()=>{
 const original=global.window,oldFetch=global.fetch;let calls=0;
 global.window={};global.fetch=async()=>{calls++;throw Error('Unexpected request');};
 try{assert.equal(await speech.koreanConversationAudioAvailable(),false);assert.equal(calls,0);}finally{global.window=original;global.fetch=oldFetch;}
});
