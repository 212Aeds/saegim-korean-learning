const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
test('conversation audio splits complete sentences without dropping text or splitting decimal numbers',()=>{
 const {conversationSpeechParts}=require('../apps/web/app/ui/conversation-speech-parts.ts');
 const text='좋아요! 트럼펫 연습하고 비디오 게임하는 거 재미있겠어요. 어제 밤에 몇 시간이나 자셨어요?';
 assert.deepEqual(conversationSpeechParts(text),['좋아요! 트럼펫 연습하고 비디오 게임하는 거 재미있겠어요.','어제 밤에 몇 시간이나 자셨어요?']);
 assert.deepEqual(conversationSpeechParts('3.14라고 말해요.'),['3.14라고 말해요.']);
 assert.deepEqual(conversationSpeechParts('안녕하세요'),['안녕하세요']);
 assert.equal(conversationSpeechParts(text).join(' '),text);
});


test('first sentence plays while the next prepares; Stop prevents later sentence playback',async()=>{
 Object.assign(process.env,{NEXT_PUBLIC_HOSTED_AI_ENABLED:'true',NEXT_PUBLIC_FREE_PUBLISHING:'false',NEXT_PUBLIC_PAID_FEATURES_ENABLED:'false',NEXT_PUBLIC_LOCAL_SPEECH_URL:'',NEXT_PUBLIC_PRERECORDED_AUDIO:'true'});
 const previous={window:global.window,Worker:global.Worker,Audio:global.Audio};const messages=[],plays=[];let audio;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem:()=>{}},speechSynthesis:{cancel(){}}};
 global.Worker=class{postMessage(data){messages.push(data);queueMicrotask(()=>this.onmessage({data:{id:data.id,type:data.type==='initialize'?'ready':'audio',wav:new ArrayBuffer(100)}}));}terminate(){}};
 global.Audio=class{constructor(){audio=this;this.src='';}pause(){}play(){if(this.src.startsWith('blob:'))plays.push(this.playbackRate);return Promise.resolve();}};
 const voices=require('../apps/web/app/ui/browser-voices.ts'),speech=require('../apps/web/app/ui/speech.ts');const tick=()=>new Promise(r=>setImmediate(r));
 const text='이 문장은 첫 번째로 들려줄 문장이에요. 다음 문장은 첫 문장을 듣는 동안 준비해요.';
 try{
  await voices.enableBrowserVoices();const result=speech.playConversationKorean(text,'jessica',.85);await tick();await tick();
  assert.equal(plays.length,1);const generated=messages.filter(m=>m.type==='synthesize');assert.equal(generated.length,2);assert.equal(generated[0].text,'이 문장은 첫 번째로 들려줄 문장이에요.');assert.equal(generated[1].text,'다음 문장은 첫 문장을 듣는 동안 준비해요.');assert.ok(generated.every(m=>m.voice==='jessica'));
  audio.onended();await tick();assert.deepEqual(plays,[.85,.85]);audio.onended();assert.equal((await result).played,true);
  const stopped=speech.playConversationKorean(text,'jessica',.85);await tick();const before=plays.length;speech.stopKoreanPlayback();assert.equal((await stopped).played,false);await tick();assert.equal(plays.length,before);
 }finally{speech.stopKoreanPlayback();voices.cancelBrowserVoices();Object.assign(global,previous);}
});

test('partner bubble is a native replay button with separate translation controls',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8');
 assert.match(ui,/type="button" className="chat-message-content chat-message-replay"/);assert.match(ui,/aria-label=\{`Replay/);assert.match(ui,/onClick=\{\(\)=>void listen\(turn.content,turn.partner\)\}/);assert.doesNotMatch(ui,/▶ Listen/);
 assert.match(ui,/ref=\{audioHost\} hidden aria-hidden="true"/);assert.match(ui,/Tap an earlier message bubble to hear it again/);
});

test('a prepared opening stays separate so it can start before a new sentence is synthesized',()=>{
 const {conversationSpeechParts}=require('../apps/web/app/ui/conversation-speech-parts.ts');
 assert.deepEqual(conversationSpeechParts('좋아요! 오늘은 어떤 음식을 먹고 싶어요?',part=>part==='좋아요!'),['좋아요!','오늘은 어떤 음식을 먹고 싶어요?']);
});

test('prepared conversation openings start from the catalog before new synthesis, at the selected pace',async()=>{
 const previous={window:global.window,Worker:global.Worker,Audio:global.Audio,fetch:global.fetch};let audio;const events=[];
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem:()=>{}},speechSynthesis:{cancel(){}}};
 global.fetch=async()=>new Response(new Uint8Array(44),{headers:{'content-type':'audio/wav'}});
 global.Worker=class{postMessage(data){if(data.type==='synthesize')events.push('generate');queueMicrotask(()=>this.onmessage({data:{id:data.id,type:data.type==='initialize'?'ready':'audio',wav:new ArrayBuffer(100)}}));}terminate(){}};
 global.Audio=class{constructor(src){this.src=src||'';}pause(){}play(){if(this.src.startsWith('/audio/')||this.src.startsWith('blob:')){audio=this;events.push({src:this.src,pace:this.playbackRate});}return Promise.resolve();}};
 delete require.cache[require.resolve('../apps/web/app/ui/browser-voices.ts')];delete require.cache[require.resolve('../apps/web/app/ui/speech.ts')];
 const voices=require('../apps/web/app/ui/browser-voices.ts'),speech=require('../apps/web/app/ui/speech.ts'),tick=()=>new Promise(r=>setImmediate(r));
 try{await voices.enableBrowserVoices();const playback=speech.playConversationKorean('좋아요! 오늘은 어떤 음식을 먹고 싶어요?','chris',.9);await tick();await tick();assert.match(events[0].src,/^\/audio\//);assert.equal(events[0].pace,.9);assert.ok(events.includes('generate'));audio.onended();await tick();assert.equal(events.at(-1).pace,.9);audio.onended();assert.equal((await playback).played,true);}finally{speech.stopKoreanPlayback();voices.cancelBrowserVoices();Object.assign(global,previous);}
});

test('prepared opening downloads do not wait for inference-model readiness',async()=>{
 const old={window:global.window,fetch:global.fetch};let fetched=0;
 global.window={setTimeout,clearTimeout};global.fetch=async url=>{fetched++;assert.match(url,/^\/audio\/lessons\//);return new Response(new Uint8Array(44),{headers:{'content-type':'audio/wav'}});};
 try{const voices=require('../apps/web/app/ui/browser-voices.ts'),speech=require('../apps/web/app/ui/speech.ts');assert.notEqual(voices.browserVoiceState().phase,'ready');await speech.prefetchConversationKorean('그렇군요. 새로운 이야기를 해 주세요.','jessica');assert.equal(fetched,1);assert.notEqual(voices.browserVoiceState().phase,'ready');}finally{Object.assign(global,old);}
});
