const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
process.env.NEXT_PUBLIC_PRERECORDED_AUDIO='true';process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;
const {playElevenLabsKorean,stopKoreanPlayback}=require('../apps/web/app/ui/speech.ts');
test('packaged Korean playback starts inside the tap without waiting for a fetch',async()=>{
 const oldWindow=global.window,oldAudio=global.Audio,oldFetch=global.fetch;let played=false,src,calls=0;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){}}};
 global.Audio=class{constructor(url){src=url;}play(){played=true;return Promise.resolve();}pause(){}};
 global.fetch=()=>{calls++;return new Promise(()=>{});};
 try{const playback=playElevenLabsKorean('안녕하세요','jessica');assert.equal(played,true);assert.equal(calls,0);assert.match(src,/^\/audio\//);assert.equal((await playback).source,'catalog');}finally{stopKoreanPlayback();global.window=oldWindow;global.Audio=oldAudio;global.fetch=oldFetch;}
});


test('default listening never silently switches to a device voice for a missing clip',async()=>{
 const old=global.window;let attempts=0;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){},getVoices(){attempts++;return []}}};
 try{const result=await playElevenLabsKorean('This missing clip must not be synthesized','chris',1);assert.equal(result.played,false);assert.equal(result.source,'unavailable');assert.equal(attempts,0);}finally{stopKoreanPlayback();global.window=old;}
});
