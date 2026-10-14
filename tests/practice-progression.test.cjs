const { readFileSync } = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,path);
const {test} = require('node:test');const assert = require('node:assert/strict');
const {lessons,isCorrectTextAnswer} = require('../apps/web/app/curriculum.ts');
const {prepareQuestions} = require('../apps/web/app/ui/lesson-questions.ts');
const {basicReadingPrerequisites,foundationLessons} = require('../apps/web/app/foundation-lessons.ts');
const {isLessonUnlocked} = require('../apps/web/app/learning-pathways.ts');
const {placementKnowledge,recommendedLessons} = require('../apps/web/app/learning-profile.ts');
const {initialProgress,createStarterReviewItems} = require('../apps/web/app/progress.ts');
const {practicePool,practiceSession,readingBlocks} = require('../apps/web/app/practice-bank.ts');
const {hangulLetters} = require('../apps/web/app/more-lessons.ts');
const {naturalSpeechText} = require('../apps/web/app/ui/hangul-answers.ts');
const {compareSpeech} = require('../apps/web/app/ui/speech-check.ts');
const {shouldSendConversationKey} = require('../apps/web/app/ui/conversation-history.ts');
test('opening practice teaches letters in order and never generates early vocabulary',()=>{
 const first=lessons.find(lesson=>lesson.id==='hangul-first-sounds');
 assert.equal(first.authoredOnly,true);assert.deepEqual(first.words,['ㄱ','ㅏ','가']);
 for(let i=0;i<20;i++){const prepared=prepareQuestions(first);assert.deepEqual(prepared.practice.map(q=>q.id),['first-gieok','first-a','first-ga']);assert.ok([...prepared.practice,...prepared.quiz].every(q=>!['가방','안녕'].includes(q.korean)));}
 assert.ok(createStarterReviewItems().every(item=>!['가방','안녕'].includes(item.front)));
 for(const id of ['hangul-more-sounds','build-a-syllable']) assert.ok(lessons.find(lesson=>lesson.id===id).words.every(word=>word.length===1));
});
test('all vocabulary and conversation lessons wait for basic reading at the new level',()=>{
 const words=lessons.filter(lesson=>lesson.category!=='Hangul');
 for(const lesson of words) assert.equal(isLessonUnlocked(lesson,['hangul-first-sounds']),false,lesson.id);
 const firstWord=lessons.find(lesson=>lesson.id==='first-readable-words');
 assert.equal(isLessonUnlocked(firstWord,basicReadingPrerequisites),true);
 const hello=lessons.find(lesson=>lesson.id==='hello-there');
 assert.equal(isLessonUnlocked(hello,[],placementKnowledge({level:'hangul'})),true);
 assert.equal(recommendedLessons(['hangul-first-sounds'],{level:'new',reasons:['travel']})[0].id,'hangul-core-vowels');
});
test('sixteen added lessons have valid prerequisites and bounded letter-only introductions',()=>{
 assert.equal(foundationLessons.length,16);
 const ids=new Set(lessons.map(lesson=>lesson.id));
 for(const lesson of foundationLessons){assert.ok(lesson.questions.length>0);assert.ok(lesson.prerequisiteLessonIds.every(id=>ids.has(id)));}
 for(const lesson of foundationLessons.slice(0,10)){assert.ok(lesson.words.every(word=>/^[ㄱ-ㅎㅏ-ㅣ]$/.test(word)));assert.ok(prepareQuestions(lesson).practice.length<=12);}
});
test('block drills generate exactly the covered consonant-vowel combinations',()=>{
 assert.deepEqual(readingBlocks(['ㄱ','ㅏ']).map(block=>block.korean),['가']);
 const blocks=readingBlocks(hangulLetters.map(letter=>letter.korean));
 assert.equal(blocks.length,399);assert.equal(new Set(blocks.map(block=>block.korean)).size,399);
 for(const block of blocks) assert.equal((block.korean.charCodeAt(0)-0xac00)%28,0);
});
test('practice excludes legacy early words for new learners and refreshes for higher placement',()=>{
 const progress={...initialProgress,completedLessonIds:['hangul-first-sounds'],wordsLearned:['가방','안녕']};
 assert.deepEqual(practicePool(progress,{level:'new',reasons:['culture']},'words'),[]);
 assert.ok(practicePool(progress,{level:'new',reasons:['culture']},'letters').length>0);
 const full=practicePool(initialProgress,{level:'intermediate',reasons:['culture']},'reading');
 assert.equal(full.length,798);assert.ok(practicePool(initialProgress,{level:'intermediate',reasons:['culture']},'sentences').length>0);
 assert.deepEqual(progress.completedLessonIds,['hangul-first-sounds']);
 const before=JSON.stringify(full);const round=practiceSession(full,100);
 assert.equal(round.length,20);assert.equal(new Set(round.map(card=>card.question.id)).size,20);assert.equal(JSON.stringify(full),before);
});
test('vowel letter audio and answers use the actual vowel names',()=>{
 assert.equal(naturalSpeechText('ㅏ'),'아');assert.equal(naturalSpeechText('ㅓ'),'어');assert.equal(compareSpeech('ㅏ','아').matches,true);assert.equal(compareSpeech('ㅏ','어').matches,false);
 const vowel=foundationLessons.find(lesson=>lesson.id==='hangul-core-vowels').questions.find(q=>q.korean==='ㅏ'&&q.answer==='a');assert.equal(isCorrectTextAnswer(vowel,'아'),true);
});
test('conversation Enter sends while Shift+Enter and Korean IME composition stay in the editor',()=>{
 assert.equal(shouldSendConversationKey('Enter',false,false),true);
 assert.equal(shouldSendConversationKey('Enter',true,false),false);
 assert.equal(shouldSendConversationKey('Enter',false,true),false);
 assert.equal(shouldSendConversationKey('Enter',false,false,229),false);
});

test('focused recovery uses actual Again cards and stays inside eligible content',()=>{
 const {recoveryPractice}=require('../apps/web/app/practice-bank.ts');
 const pool=practicePool(initialProgress,{level:'new',reasons:['travel']},'mixed');
 const progress={...initialProgress,reviewItems:[{front:'ㄱ',lastResult:'again'},{front:'가방',lastResult:'again'},{front:'ㅏ',lastResult:'remembered'}]};
 const result=recoveryPractice(pool,progress);
 assert.ok(result.length>0);assert.ok(result.every(card=>card.reference==='ㄱ'&&!card.listening));
 assert.deepEqual(recoveryPractice(pool,initialProgress),[]);
});
test('listening rounds add distinct eligible dictation without exposing Korean targets',()=>{
 const {listeningPractice}=require('../apps/web/app/practice-bank.ts');
 for(const level of ['new','basic','advanced']){
  const pool=practicePool(initialProgress,{level,reasons:['travel']},'mixed'),round=listeningPractice(pool);
  assert.ok(round.length>0);assert.equal(new Set(round.map(c=>c.question.id)).size,round.length);
  assert.ok(round.every(c=>c.listening&&c.question.korean==='?'&&pool.some(p=>p.reference===c.reference)));
  for(const card of round.filter(c=>c.question.id.startsWith('ear-'))){assert.equal(card.question.answer,card.reference);assert.equal(card.question.type,'text');}
  if(level==='new')assert.ok(round.every(c=>c.mode==='letters'||c.mode==='reading'));
 }
});
test('practice breakdown reports first tries by actual skill and ignores duplicate misses',()=>{
 const {practiceBreakdown}=require('../apps/web/app/practice-bank.ts');
 const cards=[{mode:'letters',question:{id:'a'}},{mode:'letters',question:{id:'b'}},{mode:'words',question:{id:'c'}}];
 assert.deepEqual(practiceBreakdown(cards,['b','b','unknown']),[{mode:'letters',total:2,firstTry:1},{mode:'words',total:1,firstTry:1}]);
});
