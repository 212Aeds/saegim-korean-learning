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
test('faster saved pace is accepted by progress storage and used with the selected local partner',async()=>{
 const {initialProgress}=require('../apps/web/app/progress.ts'),{progressSchema}=require('../apps/api/src/progress.schema.ts');
 const saved=progressSchema.parse({...initialProgress,learningPreferences:{speechVoice:'chris',speechPace:1.3}});
 assert.equal(saved.learningPreferences.speechPace,1.3);
 const oldFetch=global.fetch,oldAudio=global.Audio,oldWindow=global.window;let audio,body;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:key=>key==='sori-speech-rate'?'1.3':key==='sori-elevenlabs-voice'?'chris':null},speechSynthesis:{cancel(){}}};
 global.Audio=class{constructor(){audio=this;}async play(){}pause(){}};
 global.fetch=async(url,options)=>{body=JSON.parse(options.body);return {ok:true,headers:new Headers({'content-type':'audio/wav'}),blob:async()=>new Blob(['sample'])};};
 try{const {preferredSpeechRate}=require('../apps/web/app/ui/speech.ts');assert.equal(preferredSpeechRate(),1.3);assert.equal((await playKorean('안녕하세요')).source,'local');assert.equal(body.voice,'chris');assert.equal(audio.playbackRate,1.3);}
 finally{stopKoreanPlayback();global.fetch=oldFetch;global.Audio=oldAudio;global.window=oldWindow;}
});
