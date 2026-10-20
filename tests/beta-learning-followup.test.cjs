const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {speechAttempt}=require('../apps/web/app/ui/speech-attempt.ts');
const {completedTutorLessons,tutorLessonContext}=require('../apps/web/app/ui/tutor-lesson-context.ts');
const {practicalGoals,practicalGoalProgress}=require('../apps/web/app/ui/practical-goals.ts');
const {lessons}=require('../apps/web/app/curriculum.ts');
const {defaultLearningProfile}=require('../apps/web/app/learning-profile.ts');
test('recognition mismatch waits for learner confirmation while written submissions and spoken matches can be graded',()=>{
 assert.deepEqual(speechAttempt('너','네',undefined,'speech'),{matches:false,needsConfirmation:true,submit:false});
 assert.deepEqual(speechAttempt('너','네',undefined,'written'),{matches:false,needsConfirmation:false,submit:true});
 assert.deepEqual(speechAttempt('너','너',undefined,'speech'),{matches:true,needsConfirmation:false,submit:true});
 assert.equal(speechAttempt('ㄱ','g',undefined,'speech').submit,true);
});
test('tutor context is bounded, takes authored facts only from a completed selected lesson, and ignores unknown IDs',()=>{
 assert.deepEqual(completedTutorLessons(['fake']),[]);const lesson=lessons.find(l=>l.briefing);const completed=[lesson.id,lesson.id,'fake'];assert.equal(completedTutorLessons(completed).length,1);
 const grounded=tutorLessonContext(defaultLearningProfile,completed,lesson.id,[]);assert.equal(grounded.lessonId,lesson.id);assert.ok(grounded.context.includes(lesson.title));assert.match(grounded.context,/exposure, not mastery/);
 const ignored=tutorLessonContext(defaultLearningProfile,[],lesson.id,[]);assert.equal(ignored.lessonId,'general-korean-tutor');assert.ok(!ignored.context.includes(lesson.title));
 assert.ok(tutorLessonContext(defaultLearningProfile,lessons.map(l=>l.id),'fake',Array(9).fill({question:'x'.repeat(1000),content:{explanation:'y'.repeat(2000)}})).context.length<=2000);
});
test('practical goals never turn placement, duplicate completion IDs or unrelated reviews into mastery',()=>{
 for(const goal of practicalGoals)for(const id of goal.lessons)assert.ok(lessons.some(l=>l.id===id),id);
 const first=practicalGoals[0],lesson=lessons.find(l=>l.id===first.lessons[0]),id=`question-${lesson.id}-${lesson.questions[0].id}`;
 const items=[{id,repetitions:3,lastResult:'remembered'},{id,repetitions:3,lastResult:'remembered'},{id:'unrelated',repetitions:99,lastResult:'remembered'}];
 let result=practicalGoalProgress([lesson.id,lesson.id,'fake'],items)[0];assert.equal(result.done,1);assert.equal(result.recalled,1);assert.equal(result.next.id,first.lessons[1]);
 result=practicalGoalProgress([],[{id,repetitions:3,lastResult:'again'}])[0];assert.equal(result.done,0);assert.equal(result.recalled,0);
});
