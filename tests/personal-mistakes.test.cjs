const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {recordLessonMistake,initialProgress,rateReviewItem}=require('../apps/web/app/progress.ts');
const q={id:'fixture',type:'text',korean:'가',prompt:'Read this syllable',answer:'ga',accepted:['ka'],tip:'Synthetic fixture'};
test('missed lesson questions enter personal review without completing a lesson',()=>{
 const next=recordLessonMistake(initialProgress,'fixture-lesson',q,new Date('2026-11-15T12:00:00Z'));
 assert.equal(next.reviewItems.length,1);assert.equal(next.reviewItems[0].lastResult,'again');assert.deepEqual(next.completedLessonIds,[]);assert.equal(next.quizAttempts,0);
 assert.deepEqual(next.reviewItems[0].accepted,['ka']);
 const repeated=recordLessonMistake(next,'fixture-lesson',q);assert.equal(repeated.reviewItems.length,1);
 const recalled=rateReviewItem(repeated,repeated.reviewItems[0].id,true);assert.equal(recalled.reviewItems[0].lastResult,'remembered');
 const missedAgain=recordLessonMistake(recalled,'fixture-lesson',q);assert.equal(missedAgain.reviewItems.length,1);assert.equal(missedAgain.reviewItems[0].lastResult,'again');assert.equal(missedAgain.reviewItems[0].repetitions,0);
});
