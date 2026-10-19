const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
process.env.NEXT_PUBLIC_PRERECORDED_AUDIO='true';delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='false';
const {recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');
test('recorded letter names resolve by selected voice and point to real WAV files',()=>{
 const {hangulLetters}=require('../apps/web/app/more-lessons.ts');
 for(const letter of hangulLetters)for(const voice of ['chris','jessica']){
  const url=recordedAudioUrl(letter.korean,voice);assert.match(url,/^\/audio\/lessons\/[a-f0-9]{64}\.wav$/);
  const bytes=fs.readFileSync(require('node:path').join(__dirname,'../apps/web/public',url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.ok(bytes.length>44);
 }
 assert.notEqual(recordedAudioUrl('ㄱ','chris'),recordedAudioUrl('ㄱ','jessica'));assert.equal(recordedAudioUrl('not a saved phrase','chris'),undefined);
});
test('recorded playback needs no speech server or paid provider and retains pace',async()=>{
 const oldFetch=global.fetch,oldWindow=global.window,oldAudio=global.Audio;let audio,calls=[];
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){}}};
 global.Audio=class{constructor(url){audio=this;this.src=url;}async play(){}pause(){}};
 global.fetch=async(url,options)=>{calls.push(url);assert.ok(url.startsWith('/audio/lessons/'));assert.equal(options.method,undefined);return {ok:true,headers:new Headers({'content-type':'audio/wav'}),blob:async()=>new Blob(['audio'])};};
 const {playElevenLabsKorean,stopKoreanPlayback}=require('../apps/web/app/ui/speech.ts');
 try{assert.equal((await playElevenLabsKorean('ㄱ','chris',1.2)).source,'catalog');assert.equal(audio.playbackRate,1.2);assert.equal(calls.length,0);assert.match(audio.src,/^\/audio\/lessons\//);}finally{stopKoreanPlayback();global.fetch=oldFetch;global.window=oldWindow;global.Audio=oldAudio;}
});

test('release audio audit verifies assets and rejects unsafe, mismatched, or missing files',()=>{
 const {auditCatalog}=require('../scripts/check-lesson-audio.cjs');
 const manifest=require('../apps/web/app/audio-manifest.json'),root=require('node:path').join(__dirname,'../apps/web/public');
 const report=auditCatalog(manifest,root);assert.ok(report.clips>=100&&report.totalBytes>0);
 assert.throws(()=>auditCatalog({'chris|hello':'/../../secret.wav'},root),/Invalid audio catalog/);
 const [key,url]=Object.entries(manifest)[0];
 assert.throws(()=>auditCatalog({['jessica|wrong-key']:url},root),/does not match/);
 assert.throws(()=>auditCatalog({[key]:url},require('node:path').join(__dirname,'not-a-real-public-folder')),error=>error.code==='ENOENT');
});
test('starter words and greetings resolve to recorded audio in both voices',()=>{
 for(const phrase of ['가방','나무','바다','우유','죄송합니다'])for(const voice of ['chris','jessica'])assert.ok(recordedAudioUrl(phrase,voice),`${voice}: ${phrase}`);
});

test('every published speaking card and pronounceable lesson review front has both named recordings',()=>{
 const {lessons}=require('../apps/web/app/curriculum.ts'),{speakingCardsForProfile}=require('../apps/web/app/speak-cards.ts');
 const {flashcardSpeechText}=require('../apps/web/app/ui/recorded-audio.ts');
 const texts=new Set(lessons.flatMap(l=>l.questions.map(q=>flashcardSpeechText(q.korean))).filter(Boolean));
 for(const level of ['new','hangul','basic','intermediate','advanced'])for(const completed of [[],lessons.map(l=>l.id)])for(const card of speakingCardsForProfile({level,reasons:['family','travel','food','living']},completed))texts.add(card.korean);
 for(const text of texts)for(const voice of ['chris','jessica'])assert.ok(recordedAudioUrl(text,voice),`${voice}: ${text}`);
 assert.equal(flashcardSpeechText('ㄱ + ㅏ'),undefined);assert.equal(flashcardSpeechText('ㄱ'),'기역');
});
