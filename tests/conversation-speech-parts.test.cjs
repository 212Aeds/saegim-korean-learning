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
