const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {lessonTextAssessment,appendLessonRetry}=require('../apps/web/app/ui/lesson-answer.ts');
const question=(answer,accepted=[])=>({id:'definition',type:'text',korean:'안녕하세요',answer,accepted});
test('exact definitions and authored equivalent meanings count without a warning',()=>{
 assert.deepEqual(lessonTextAssessment(question('hello',['hi']),'Hi!'),{correct:true,near:false});
});
test('one spelling edit counts with a note; short Korean and different meaning stay exact',()=>{
 assert.deepEqual(lessonTextAssessment(question('restaurant'),'restaurannt'),{correct:true,near:true});
 for(const [answer,input] of [['son','sun'],['hello','help'],['I want food','I do not want food'],['너','네'],['mother','father'],['g','k'],['restaurant','restoront']])assert.equal(lessonTextAssessment(question(answer),input).correct,false,`${answer} / ${input}`);
});
test('a miss returns after remaining questions without mutating originals; repeated misses remain reviewable',()=>{
 const initial=['first','middle','last'];const retry=appendLessonRetry(initial,0);
 assert.deepEqual(initial,['first','middle','last']);assert.deepEqual(retry,['first','middle','last','first']);
 assert.deepEqual(appendLessonRetry(retry,3),['first','middle','last','first','first']);
});
test('lesson feedback freezes choices, retries misses and scores only original turns',()=>{
 const source=fs.readFileSync('apps/web/app/ui/lesson-modal.tsx','utf8');
 assert.match(source,/disabled=\{showTip\}/);assert.match(source,/if \(!matched\)/);assert.match(source,/correct && originalTurn/);assert.match(source,/<SoriMascot thumbsUp/);
});

test('follow-up context retains the previous practice question as well as explanation',()=>{
 const {tutorLessonContext}=require('../apps/web/app/ui/tutor-lesson-context.ts');
 const {defaultLearningProfile}=require('../apps/web/app/learning-profile.ts');
 const result=tutorLessonContext(defaultLearningProfile,[],'',[{question:'How do I ask a price?',content:{explanation:'Use 얼마예요.',hint:'Use polite speech.',nextExercise:'Ask the price of this item.'}}]);
 assert.match(result.context,/Ask the price of this item/);assert.match(result.context,/Resolve follow-up questions/);assert.ok(result.context.length<=2000);
});
