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
  assert.equal((await playKorean('ㄷ',{naturalOnly:true})).played,false);
  assert.deepEqual(urls,['http://127.0.0.1:5055/v1/speech/synthesize','http://127.0.0.1:5055/v1/speech/synthesize']);
 }finally{stopKoreanPlayback();global.fetch=oldFetch;global.Audio=oldAudio;global.window=oldWindow;}
});

test('local preparation is shared with playback and stopping never plays stale audio',async()=>{
 const {prefetchLocalKorean,playElevenLabsKorean}=require('../apps/web/app/ui/speech.ts');
 const oldFetch=global.fetch,oldAudio=global.Audio,oldWindow=global.window;
 let release,requests=0,plays=0;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){}}};
 global.Audio=class{async play(){plays++;}pause(){}};
 global.fetch=async()=>{requests++;await new Promise(resolve=>{release=resolve;});return {ok:true,headers:new Headers({'content-type':'audio/wav'}),blob:async()=>new Blob(['prepared'])};};
 try{
  const prepared=prefetchLocalKorean('새로운 연습 문장','chris');
  const cancelled=playElevenLabsKorean('새로운 연습 문장','chris',0.85,{naturalOnly:true});
  stopKoreanPlayback();release();await prepared;await cancelled;
  assert.equal(plays,0);
  assert.equal((await playElevenLabsKorean('새로운 연습 문장','chris',0.85,{naturalOnly:true})).played,true);
  assert.equal(requests,1);
  assert.equal(plays,1);
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

test('rapid card navigation prepares the newest pending clip without queuing obsolete cards',async()=>{
 const {prefetchLocalKorean}=require('../apps/web/app/ui/speech.ts');
 const oldFetch=global.fetch,oldWindow=global.window;const requests=[],finishes=new Map();
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null}};
 global.fetch=async(_,options)=>{const text=JSON.parse(options.body).text;requests.push(text);await new Promise(resolve=>finishes.set(text,resolve));return {ok:true,headers:new Headers({'content-type':'audio/wav'}),blob:async()=>new Blob(['clip'])};};
 try{
  const first=prefetchLocalKorean('첫 준비','chris');await new Promise(resolve=>setImmediate(resolve));
  const obsolete=prefetchLocalKorean('지난 준비','chris'),latest=prefetchLocalKorean('마지막 준비','chris');
  assert.deepEqual(requests,['첫 준비']);
  finishes.get('첫 준비')();await first;await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(requests,['첫 준비','마지막 준비']);
  finishes.get('마지막 준비')();await Promise.all([obsolete,latest]);
 }finally{global.fetch=oldFetch;global.window=oldWindow;}
});
