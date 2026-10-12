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
