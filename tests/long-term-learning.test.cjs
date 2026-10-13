const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {lessons}=require('../apps/web/app/curriculum.ts');
const {chapterProgress}=require('../apps/web/app/chapter-progress.ts');
const {initialProgress,createQuestionReviewItems,deduplicateReviewItems,recordActivity}=require('../apps/web/app/progress.ts');
const {progressSchema}=require('../apps/api/src/progress.schema.ts');
const {habitProgress}=require('../apps/web/app/habit-progress.ts');
const {speakingCardsForProfile,normalizeSpeakingCardIds}=require('../apps/web/app/speak-cards.ts');
const {placementKnowledge}=require('../apps/web/app/learning-profile.ts');
const {conversationRequestSchema}=require('../apps/api/src/tutor/tutor.schema.ts');

test('chapter progress needs all three actual lessons and ignores duplicate or unknown IDs',()=>{
 let chapter=chapterProgress(['home-words','home-words','unknown']).find(c=>c.id==='home');
 assert.equal(chapter.done,1);assert.equal(chapter.complete,false);assert.equal(chapter.nextLessonId,'home-dialogue');
 chapter=chapterProgress(['home-words','home-dialogue','home-consolidation']).find(c=>c.id==='home');
 assert.equal(chapter.complete,true);assert.equal(chapter.nextLessonId,'home-consolidation');
 assert.equal(chapterProgress([]).filter(c=>c.complete).length,0);
});
test('a complete course review collection can be stored without the previous 500-card failure',()=>{
 const cards=deduplicateReviewItems(lessons.flatMap(l=>createQuestionReviewItems(l.id,l.questions)));
 assert.ok(cards.length>500);assert.equal(lessons.length,102);
 const full={...initialProgress,completed:lessons.length,completedLessonIds:lessons.map(l=>l.id),reviewItems:cards};
 const saved=progressSchema.safeParse(full);assert.equal(saved.success,true,saved.error?.message);
 assert.ok(Buffer.byteLength(JSON.stringify(full))>100*1024);
 assert.ok(Buffer.byteLength(JSON.stringify(full))<2*1024*1024);
 assert.equal(progressSchema.safeParse({...full,reviewItems:Array(2001).fill(cards[0])}).success,false);
});
test('recorded study supports a full year and reaches a real year milestone',()=>{
 let progress=initialProgress,last;
 for(let day=0;day<366;day++){last=new Date(2025,0,1+day,12);progress=recordActivity(progress,last);}
 const habit=habitProgress(progress,last);
 assert.equal(habit.current,366);assert.equal(habit.best,366);
 assert.equal(habit.milestones.find(m=>m.days===365).earned,true);
 assert.equal(progressSchema.safeParse(progress).success,true);
});
test('new speaking examples keep saved IDs and unlock only after their lesson prerequisites',()=>{
 const ids=lessons.map(l=>l.id),advanced={level:'advanced',reasons:['travel']};
 const full=speakingCardsForProfile(advanced,ids);
 assert.ok(full.some(c=>c.korean==='창문을 열어요.'));
 assert.ok(full.some(c=>c.korean==='메시지를 보내요.'));
 assert.equal(new Set(full.map(c=>c.korean)).size,full.length);
 assert.deepEqual(normalizeSpeakingCardIds(full.map(c=>c.id)),full.map(c=>c.id));
 const basic={level:'basic',reasons:['living']},before=speakingCardsForProfile(basic,[]);
 assert.ok(!before.some(c=>c.id==='speak-example-home-5'));
 const after=speakingCardsForProfile(basic,[...placementKnowledge(basic),'home-words','polite-present']);
 assert.ok(after.some(c=>c.korean==='창문을 열어요.'));
 const earned=speakingCardsForProfile({level:'hangul',reasons:['living']},['home-words','polite-present']);
 assert.ok(earned.some(c=>c.korean==='창문을 열어요.'));
});
test('new tutor situations keep the existing conversation request contract',()=>{
 for(const scenario of ['home','stay','messages','plans'])
  assert.equal(conversationRequestSchema.safeParse({messages:[{role:'user',content:'안녕하세요'}],level:'basic',scenario,consent:true}).success,true);
});
