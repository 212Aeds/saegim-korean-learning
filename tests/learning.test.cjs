const { readFileSync } = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, path);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { editKorean } = require('../apps/web/app/ui/korean-input.ts');
const { compareSpeech, silenceDecision } = require('../apps/web/app/ui/speech-check.ts');
const { initialProgress, recordDailyPractice, rateReviewItem } = require('../apps/web/app/progress.ts');
const { encodeWav } = require('../apps/web/app/ui/openrouter-audio-capture.ts');
const { recommendedLessons, learningRoute } = require('../apps/web/app/learning-profile.ts');
const { transcriptRomanization } = require('../apps/web/app/ui/transcript-romanization.ts');
const { weeklyProgress, accountAvatar } = require('../apps/web/app/account-personalization.ts');
const { lessons } = require('../apps/web/app/curriculum.ts');
const { speakingCards } = require('../apps/web/app/speak-cards.ts');
const { dailyPlan } = require('../apps/web/app/daily-plan.ts');
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
test('price speaking accepts equivalent questions without accepting a different question or writing typo', () => {
  assert.equal(compareSpeech('이거 얼마예요?', '이것은 얼마예요?', true).matches, true);
  assert.equal(compareSpeech('이거 얼마예요?', '이거 얼마에요?', true).matches, true);
  assert.equal(compareSpeech('이거 얼마예요?', '얼마예요?', true).matches, true);
  assert.equal(compareSpeech('이거 얼마예요?', '어디예요?', true).matches, false);
  assert.equal(compareSpeech('이거 얼마예요?', '이거 얼마에요?', false).matches, false);
});
test('every speaking target accepts itself and rejects an unrelated utterance', () => {
  for (const card of speakingCards) {
    assert.equal(compareSpeech(card.korean, card.korean, true).matches, true, card.id);
    assert.equal(compareSpeech(card.korean, '도서관에서 책을 빌려요', true).matches, false, card.id);
  }
});
test('recommendations use proficiency, avoid completed lessons, and preserve prerequisites', () => {
  const beginner = recommendedLessons([], { level: 'new', reasons: ['travel'] });
  assert.equal(beginner[0].category, 'Hangul');
  const traveler = recommendedLessons([], { level: 'basic', reasons: ['travel'] });
  assert.notEqual(traveler[0].category, 'Hangul');
  const after = recommendedLessons([traveler[0].id], { level: 'basic', reasons: ['travel'] });
  assert.ok(after.every((lesson) => lesson.id !== traveler[0].id));
  assert.ok(after.every((lesson) => (lesson.prerequisiteLessonIds ?? []).every((id) => !lessons.some((item) => item.id === id) || id === traveler[0].id)));
});
test('new lessons have unique identities, valid prerequisites, and nonempty authored questions', () => {
  const ids = new Set(lessons.map((lesson) => lesson.id));
  assert.equal(ids.size, lessons.length);
  for (const id of ['shopping-prices', 'travel-find-places', 'family-short-introductions']) {
    const lesson = lessons.find((lesson) => lesson.id === id);
    assert.ok(lesson.questions.length >= 5);
    assert.ok(lesson.prerequisiteLessonIds.every((required) => ids.has(required)));
  }
});
test('quests omit unavailable reviews, ignore yesterday, and offer revisits after course completion', () => {
  const date = new Date(2026, 9, 11, 12);
  const empty = dailyPlan(initialProgress, date);
  assert.equal(empty.reviewGoal, 0);
  assert.equal(empty.daily.lessons.length, 0);
  const old = { ...initialProgress, completedLessonIds: lessons.map((lesson) => lesson.id), dailyPractice: { date: '2026-10-10', lessons: ['old'], reviews: ['old'], speaking: ['old'] } };
  const plan = dailyPlan(old, date);
  assert.equal(plan.revisit, true);
  assert.equal(plan.lessonGoal, 1);
  assert.equal(plan.daily.lessons.length, 0);
});
test('profile routes are complete, unique, and put prerequisites before dependent lessons', () => {
  for (const level of ['new', 'hangul', 'basic', 'intermediate']) {
    const route = learningRoute({level, reasons: ['travel']});
    assert.equal(route.length, lessons.length);
    assert.equal(new Set(route.map((item)=>item.id)).size, lessons.length);
    for (const lesson of route) for (const prerequisite of lesson.prerequisiteLessonIds ?? []) {
      assert.ok(route.findIndex((item)=>item.id===prerequisite) < route.indexOf(lesson), lesson.id);
    }
  }
});
test('romanization follows what was heard, not the expected answer', () => {
  assert.equal(transcriptRomanization('너'), 'neo');
  assert.equal(transcriptRomanization('사과'), 'sagwa');
  assert.equal(transcriptRomanization('학교'), 'hakgyo');
  assert.equal(transcriptRomanization(''), '');
});
test('missed-card practice tracks actual ratings and clears the missed flag after recall', () => {
  const card = {id:'test',front:'너',question:'Recall',answer:'you',note:'Test',repetitions:0,dueAt:new Date().toISOString()};
  const missed = rateReviewItem({...initialProgress,reviewItems:[card]}, 'test', false);
  assert.equal(missed.reviewItems[0].lastResult,'again');
  const recovered = rateReviewItem(missed,'test',true);
  assert.equal(recovered.reviewItems[0].lastResult,'remembered');
  assert.equal(recovered.reviewsDone,1);
});
test('weekly goal counts unique local study dates and ignores future and previous-week activity', () => {
  const result = weeklyProgress(['2026-10-04','2026-10-05','2026-10-05','2026-10-06','2026-10-11','2026-10-12'],3,new Date(2026,9,11,12));
  assert.equal(result.studied,3);
  assert.equal(result.complete,true);
  assert.equal(result.remaining,0);
  assert.equal(accountAvatar(),'🌱');
  assert.equal(accountAvatar({level:'basic',reasons:['travel'],avatar:'cat'}),'🐱');
});
