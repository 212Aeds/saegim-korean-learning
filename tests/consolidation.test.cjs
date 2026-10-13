const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {consolidationLessons}=require('../apps/web/app/consolidation-lessons.ts');const {lessons}=require('../apps/web/app/curriculum.ts');const {isLessonUnlocked}=require('../apps/web/app/learning-pathways.ts');const {learningRoute}=require('../apps/web/app/learning-profile.ts');
const {initialProgress,createQuestionReviewItems}=require('../apps/web/app/progress.ts');const {progressSchema}=require('../apps/api/src/progress.schema.ts');
test('consolidation keeps known prerequisites, unique question IDs, and distinct choices',()=>{
 assert.equal(consolidationLessons.length,17);assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
 for(const l of consolidationLessons){assert.ok(lessons.includes(l));assert.ok(l.questions.length>=12);assert.equal(new Set(l.questions.map(q=>q.id)).size,l.questions.length);for(const id of l.prerequisiteLessonIds)assert.ok(lessons.some(other=>other.id===id));for(const q of l.questions){if(q.type==='choice'){assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.includes(q.answer));}assert.notEqual(q.korean,'?');}}
});
test('new exercise review cards fit the existing persistent progress contract',()=>{
 const cards=consolidationLessons.flatMap(l=>createQuestionReviewItems(l.id,l.questions));assert.equal(cards.length,240);const saved=progressSchema.safeParse({...initialProgress,reviewItems:cards});assert.equal(saved.success,true,saved.error?.message);
});
test('beginner checkpoints stay behind their letters and topic practice behind its exchange',()=>{
 assert.equal(isLessonUnlocked(consolidationLessons.find(l=>l.id==='food-consolidation'),[]),false);
 assert.equal(isLessonUnlocked(consolidationLessons.find(l=>l.id==='checkpoint-vowels'),['hangul-first-sounds']),false);
 const route=learningRoute({level:'new',reasons:['food']});assert.ok(route.findIndex(l=>l.id==='checkpoint-vowels')>route.findIndex(l=>l.id==='hangul-round-vowels'));assert.ok(route.findIndex(l=>l.id==='food-consolidation')>route.findIndex(l=>l.id==='food-dialogue'));
});
