const { readFileSync } = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, path);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { editKorean } = require('../apps/web/app/ui/korean-input.ts');
const { compareSpeech, silenceDecision } = require('../apps/web/app/ui/speech-check.ts');
const { initialProgress, recordDailyPractice } = require('../apps/web/app/progress.ts');
const { encodeWav } = require('../apps/web/app/ui/openrouter-audio-capture.ts');
test('keyboard composes and deletes jamo, including compound vowels and cursor selection', () => {
  assert.equal(editKorean('ㄴ', 1, 1, 'ㅓ').value, '너');
  assert.equal(editKorean('너', 1, 1, 'backspace').value, 'ㄴ');
  assert.equal(editKorean('고', 1, 1, 'ㅏ').value, '과');
  assert.equal(editKorean('가나', 1, 2, 'ㄷ').value, '갇');
  assert.equal(editKorean('안녕', 2, 2, 'space').value, '안녕 ');
});
test('speech ignores punctuation, keeps Korean distinctions and supports isolated jamo', () => {
  assert.equal(compareSpeech('너', '너.').matches, true);
  assert.equal(compareSpeech('너', '네').matches, false);
  assert.equal(compareSpeech('ㄴ', '니은').matches, true);
  assert.equal(compareSpeech('안녕하세요', '안녕 하세요!').matches, true);
});
test('silence allows initial thinking and ends only after sustained quiet', () => {
  assert.equal(silenceDecision(1500, 0, false), 'continue');
  assert.equal(silenceDecision(5000, 3000, true), 'transcribe');
  assert.equal(silenceDecision(3500, 3000, true), 'continue');
  assert.equal(silenceDecision(8000, 0, false), 'empty');
});
test('daily practice counts unique activities and resets on a new local day', () => {
  const today = new Date(2026, 9, 11, 12);
  const nextDay = new Date(2026, 9, 12, 12);
  const first = recordDailyPractice(initialProgress, 'lessons', 'lesson-1', today);
  const repeated = recordDailyPractice(first, 'lessons', 'lesson-1', today);
  assert.equal(repeated.dailyPractice.lessons.length, 1);
  const reset = recordDailyPractice(repeated, 'reviews', 'card-1', nextDay);
  assert.equal(reset.dailyPractice.lessons.length, 0);
  assert.deepEqual(reset.dailyPractice.reviews, ['card-1']);
});
test('recording removes long silence, retains speech padding, and rejects silent clips', () => {
  const samples = new Float32Array(16000 * 4);
  samples.fill(0.1, 16000, 19200);
  const capture = { samples: samples.length, chunks: [samples], context: { sampleRate: 16000 } };
  const wav = encodeWav(capture);
  assert.ok(wav.byteLength < samples.length * 2);
  const header = new DataView(wav);
  assert.equal(header.getUint32(40, true), wav.byteLength - 44);
  assert.throws(() => encodeWav({ ...capture, chunks: [new Float32Array(samples.length)] }), /No speech/);
});
