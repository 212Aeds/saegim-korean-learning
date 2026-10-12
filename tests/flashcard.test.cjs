const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, path) => module._compile(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, path);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { FlipCard } = require('../apps/web/app/ui/flip-card.tsx');
const { playCorrectAnswerSound } = require('../apps/web/app/ui/feedback-sound.ts');
test('flip cards expose only the visible face and make the hidden face inert', () => {
 for (const flipped of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(FlipCard, {flipped, front: 'QUESTION', back: 'ANSWER'}));
  assert.match(html, flipped ? /aria-hidden="true" inert="">QUESTION/ : /aria-hidden="false">QUESTION/);
  assert.match(html, flipped ? /aria-hidden="false">ANSWER/ : /aria-hidden="true" inert="">ANSWER/);
  assert.equal(html.includes('is-turned'), flipped);
 }
});
test('practice chime plays two ascending notes, respects mute, and tolerates missing audio', () => {
 const frequencies = [];
 let muted = 'true';
 class AudioContext {
  currentTime = 0; state = 'running'; destination = {};
  createOscillator() { const frequency = { value: 0 }; return { frequency, connect() {}, start() { frequencies.push(frequency.value); }, stop() {} }; }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
 }
 global.window = { AudioContext, localStorage: { getItem: () => muted } };
 global.AudioContext = AudioContext;
 try {
  playCorrectAnswerSound(); assert.equal(frequencies.length, 0);
  muted = 'false'; playCorrectAnswerSound(); assert.deepEqual(frequencies, [659.25, 783.99]);
  delete window.AudioContext; assert.doesNotThrow(playCorrectAnswerSound);
 } finally { delete global.window; delete global.AudioContext; }
});
const { reviewSession } = require('../apps/web/app/ui/review-session.ts');
test('optional saved-card practice caps a deduplicated session and preserves the saved queue', () => {
 const items = Array.from({length: 15}, (_, index) => ({id: `card-${index}`, front: `word${index}`, answer: `meaning${index}`, question: 'Recall', note: 'Practice', dueAt: '2026-10-12T00:00:00Z', stage: 0}));
 const input = [...items, items[0]];
 const snapshot = JSON.stringify(input);
 const session = reviewSession(input, 10);
 assert.equal(session.length, 10);
 assert.equal(new Set(session.map(card => card.id)).size, 10);
 assert.equal(JSON.stringify(input), snapshot);
 assert.equal(reviewSession(input).length, 15);
 assert.deepEqual(reviewSession([], 10), []);
});
