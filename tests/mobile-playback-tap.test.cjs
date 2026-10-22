const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
test('blocked generated audio is retained and replay starts synchronously inside the next tap',async()=>{
 Object.assign(process.env,{NEXT_PUBLIC_HOSTED_AI_ENABLED:'true',NEXT_PUBLIC_FREE_PUBLISHING:'false',NEXT_PUBLIC_PAID_FEATURES_ENABLED:'false',NEXT_PUBLIC_LOCAL_SPEECH_URL:'',NEXT_PUBLIC_PRERECORDED_AUDIO:'true'});
 const old={window:global.window,Worker:global.Worker,Audio:global.Audio};let inTap=false,generated=0,startedInTap=false;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem(){}},speechSynthesis:{cancel(){}}};
 global.Worker=class{postMessage(m){if(m.type==='synthesize')generated++;queueMicrotask(()=>this.onmessage({data:{id:m.id,type:m.type==='initialize'?'ready':'audio',...(m.type==='synthesize'?{wav:new ArrayBuffer(100)}:{})}}));}terminate(){}};
 global.Audio=class{constructor(src){this.src=src||'';}pause(){}play(){if(this.src.startsWith('data:'))return Promise.resolve();if(!inTap)return Promise.reject(new DOMException('Tap required','NotAllowedError'));startedInTap=true;return Promise.resolve();}};
 const speech=require('../apps/web/app/ui/speech.ts'),voices=require('../apps/web/app/ui/browser-voices.ts');
 try{const first=await speech.playElevenLabsKorean('가족과 같이 이야기해요.','jessica');assert.equal(first.needsTap,true);assert.equal(generated,1);
 assert.equal((await fetch(voices.browserVoicePlaybackElement().src)).ok,true,"blocked audio remains usable by the visible native player");
 inTap=true;const replay=speech.playElevenLabsKorean('가족과 같이 이야기해요.','jessica');inTap=false;
 assert.equal(startedInTap,true);assert.equal((await replay).played,true);assert.equal(generated,1);
 }finally{speech.stopKoreanPlayback();voices.cancelBrowserVoices();Object.assign(global,old);}
});
