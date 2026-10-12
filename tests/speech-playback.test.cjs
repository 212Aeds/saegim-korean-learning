const { readFileSync } = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, path);
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.NEXT_PUBLIC_API_URL = 'http://speech.test';
const { playElevenLabsKorean, stopKoreanPlayback } = require('../apps/web/app/ui/speech.ts');
test('consonant playback sends its Korean name to the selected natural voice and refuses device fallback', async () => {
 const originalFetch = global.fetch;
 const originalAudio = global.Audio;
 let deviceAttempts = 0; const requests = [];
 global.window = { setTimeout, clearTimeout, localStorage: {getItem:()=>null}, speechSynthesis: {cancel() {}, getVoices() {deviceAttempts++;return [];} } };
 global.Audio = class {playbackRate=1; async play() {} pause() {} };
 try {
  global.fetch = async (url, options) => {requests.push(JSON.parse(options.body)); return {ok:true,headers:new Headers({'content-type':'audio/mpeg'}),blob: async()=>new Blob(['sample'],{type:'audio/mpeg'})};};
  const chris = await playElevenLabsKorean('ㄱ', 'chris');
  assert.equal(chris.source,'elevenlabs'); assert.deepEqual(requests[0],{text:'기역',voice:'chris'});
  const jessica = await playElevenLabsKorean('ㄴ', 'jessica');
  assert.equal(jessica.source,'elevenlabs'); assert.deepEqual(requests[1],{text:'니은',voice:'jessica'});
  global.fetch = async()=>({ok:false});
  assert.equal((await playElevenLabsKorean('ㄱ','chris')).played,false);
  assert.equal((await playElevenLabsKorean('안녕하세요','jessica',1,{naturalOnly:true})).played,false);
  assert.equal(deviceAttempts,0);
 } finally {stopKoreanPlayback(); global.fetch=originalFetch; global.Audio=originalAudio; delete global.window;}
});
test('voice conversation waits for audio end and stopping releases the wait',async()=>{
 const originalFetch=global.fetch,originalAudio=global.Audio;let audio, pauses=0;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){}}};
 global.Audio=class {async play(){audio=this;}pause(){pauses++;}};
 global.fetch=async()=>({ok:true,headers:new Headers({'content-type':'audio/mpeg'}),blob:async()=>new Blob(['sample'])});
 try {let settled=false;const result=playElevenLabsKorean('안녕하세요','jessica',1,{naturalOnly:true,waitForEnd:true}).then(value=>{settled=true;return value;});await new Promise(resolve=>setImmediate(resolve));assert.equal(settled,false);audio.onended();assert.equal((await result).played,true);
 const stopped=playElevenLabsKorean('안녕하세요','chris',1,{naturalOnly:true,waitForEnd:true});await new Promise(resolve=>setImmediate(resolve));stopKoreanPlayback();assert.equal((await stopped).played,false);assert.equal(pauses,1);
 }finally{stopKoreanPlayback();global.fetch=originalFetch;global.Audio=originalAudio;delete global.window;}
});
test('an aborted old voice request cannot cancel the next reply',async()=>{
 const originalFetch=global.fetch,originalAudio=global.Audio;let rejectOld,audio;
 global.window={setTimeout,clearTimeout,localStorage:{getItem:()=>null},speechSynthesis:{cancel(){}}};global.Audio=class{async play(){audio=this;}pause(){}};
 let requests=0;global.fetch=async()=>{if(requests++===0)return new Promise((resolve,reject)=>{rejectOld=reject;});return {ok:true,headers:new Headers({'content-type':'audio/mpeg'}),blob:async()=>new Blob(['sample'])};};
 try{const old=playElevenLabsKorean('안녕','jessica',1,{naturalOnly:true,waitForEnd:true});const next=playElevenLabsKorean('안녕하세요','chris',1,{naturalOnly:true,waitForEnd:true});await new Promise(resolve=>setImmediate(resolve));rejectOld(new Error('Aborted old request'));await old;audio.onended();assert.equal((await next).played,true);}finally{stopKoreanPlayback();global.fetch=originalFetch;global.Audio=originalAudio;delete global.window;}
});
