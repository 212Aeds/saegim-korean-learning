const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {reviewSession,reviewOverview}=require('../apps/web/app/ui/review-session.ts');
const {initialProgress,rateReviewItem}=require('../apps/web/app/progress.ts');
const card=(id,dueAt,repetitions=0,lastResult)=>({id,front:id,question:'Meaning?',answer:id,note:'',dueAt,repetitions,lastResult});
test('missed and oldest cards lead a capped session without mutating saved progress',()=>{
 const cards=[card('later','2026-10-15',4,'remembered'),card('new','2026-10-12'),card('old','2026-10-01',1),card('missed','2026-10-12',0,'again')];const before=structuredClone(cards);
 assert.deepEqual(reviewSession(cards,2).map(c=>c.id),['missed','old']);assert.deepEqual(cards,before);
});
test('review overview separates due, recovery, and repeated recall without claiming mastery',()=>{
 const cards=[card('again','2026-10-13',0,'again'),card('old','2026-10-01',1),card('later','2026-10-15',3,'remembered')];
 assert.deepEqual(reviewOverview(cards,new Date('2026-10-12T12:00:00Z')),{total:3,due:1,recovery:1,established:1});
});
test('rating an absent review ID cannot award practice or a streak',()=>{
 const p={...initialProgress,reviewItems:[card('known','2026-10-12')]};assert.deepEqual(rateReviewItem(p,'missing',true),p);
});

test('review avoids adjacent identical Korean fronts when a different item is available in the selected round',()=>{
 const cards=[{...card('a','2026-10-01',0,'again'),front:'가족'},{...card('b','2026-10-02',0,'again'),front:'가족'},{...card('c','2026-10-03'),front:'밥'}];const before=structuredClone(cards);assert.deepEqual(reviewSession(cards).map(c=>c.id),['a','c','b']);assert.deepEqual(cards,before);assert.equal(reviewSession(cards,2).length,2);assert.deepEqual(reviewSession(cards,0),[]);
});
