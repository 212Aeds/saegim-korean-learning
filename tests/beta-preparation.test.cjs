const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {wordRecallLessons}=require('../apps/web/app/word-recall-lessons.ts');
const {lessons,isCorrectTextAnswer}=require('../apps/web/app/curriculum.ts');
const {learningRoute}=require('../apps/web/app/learning-profile.ts');
const {isLessonUnlocked}=require('../apps/web/app/learning-pathways.ts');
const {makeFeedbackReport}=require('../apps/web/app/ui/feedback-report-text.ts');
test('word recall lessons reuse chapter senses, gate on the word lesson and precede exchanges',()=>{
 assert.equal(wordRecallLessons.length,14);
 const route=learningRoute({level:'basic',reasons:['travel']}).map(l=>l.id);
 for(const lesson of wordRecallLessons){
   const source=lessons.find(l=>l.id===lesson.prerequisiteLessonIds[0]);
   assert.equal(isLessonUnlocked(lesson,[]),false);
   assert.ok(route.indexOf(source.id)<route.indexOf(lesson.id));
   assert.equal(lesson.questions.length,6);
   assert.deepEqual(lesson.words,source.words);
   for(const q of lesson.questions){assert.equal(q.type,'text');assert.ok(isCorrectTextAnswer(q,q.answer));assert.ok(q.accepted.every(a=>isCorrectTextAnswer(q,a)));assert.equal(isCorrectTextAnswer(q,'unrelated answer'),false);}
 }
 assert.ok(route.indexOf('food-word-recall')<route.indexOf('at-the-cafe'));
});
test('feedback reports include only explicit report fields and bound their size',()=>{
 const report=makeFeedbackReport({area:'speak',publishing:true,title:' Audio stopped ',steps:'Listen, then change card.',expected:'The next card is silent.',email:'private@example.org',conversation:'private chat',password:'secret'});
 assert.match(report,/Area: speak/);assert.match(report,/Public website/);assert.match(report,/Audio stopped/);
 for(const secret of ['private@example.org','private chat','secret'])assert.ok(!report.includes(secret));
 assert.ok(makeFeedbackReport({area:'learn',publishing:false,title:'x'.repeat(1000),steps:'x'.repeat(5000),expected:'x'.repeat(5000)}).length<3000);
});
