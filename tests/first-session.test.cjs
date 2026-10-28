const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {starterJourney,isStarterLesson}=require('../apps/web/app/first-session.ts');
test('a brand-new learner gets three foundation steps beginning with the actual first lesson',()=>{
 const journey=starterJourney({level:'new',reasons:['family']},[]);
 assert.equal(journey.steps.length,3);assert.equal(journey.nextLesson.id,'hangul-first-sounds');
 assert.ok(journey.steps.every(s=>s.lesson.category==='Hangul'&&s.lesson.briefing));assert.equal(journey.completed,0);
});
test('completion advances through prerequisites without awarding progress or mutating inputs',()=>{
 const p={level:'new',reasons:['travel']};const first=starterJourney(p,[]);const completed=[first.nextLesson.id];const before=JSON.stringify(completed);
 const next=starterJourney(p,completed);assert.equal(next.completed,1);assert.ok(next.nextLesson.prerequisiteLessonIds.every(id=>completed.includes(id)));assert.equal(JSON.stringify(completed),before);
 const all=first.steps.map(s=>s.lesson.id);assert.equal(starterJourney(p,all),null);
});
test('experienced levels and learners with progress outside the starter route retain the full dashboard',()=>{
 for(const level of ['hangul','basic','intermediate','advanced'])assert.equal(starterJourney({level,reasons:['family']},[]),null);
 assert.equal(starterJourney({level:'new',reasons:['family']},['food-words']),null);
});
test('authored starter-question policy covers the first three lessons without changing later speech practice',()=>{
 const journey=starterJourney({level:'new',reasons:['family']},[]);
 assert.ok(journey.steps.every(step=>isStarterLesson(step.lesson.id)));
 assert.equal(isStarterLesson('family-dialogue'),false);assert.equal(isStarterLesson('hangul-y-vowels'),false);
});
