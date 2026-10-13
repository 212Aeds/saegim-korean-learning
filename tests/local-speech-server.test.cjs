const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL='http://127.0.0.1:5055';
process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';
const {playKorean,stopKoreanPlayback}=require('../apps/web/app/ui/speech.ts');
test('local speech is preferred with paid services disabled and failure never calls cloud',async()=>{
 const oldFetch=global.fetch,oldAudio=global.Audio,oldWindow=global.window;const urls=[];
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){},getVoices(){return [];}}};
 global.Audio=class{async play(){}pause(){}};
 try{
  global.fetch=async(url)=>{urls.push(url);return {ok:true,headers:new Headers({'content-type':'audio/wav'}),blob:async()=>new Blob(['sample'])};};
  assert.equal((await playKorean('ㄱ',{naturalOnly:true})).source,'local');
  global.fetch=async(url)=>{urls.push(url);throw Error('offline');};
  assert.equal((await playKorean('ㄱ',{naturalOnly:true})).played,false);
  assert.deepEqual(urls,['http://127.0.0.1:5055/v1/speech/synthesize','http://127.0.0.1:5055/v1/speech/synthesize']);
 }finally{stopKoreanPlayback();global.fetch=oldFetch;global.Audio=oldAudio;global.window=oldWindow;}
});
