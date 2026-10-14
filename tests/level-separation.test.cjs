const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {speakingCardsForProfile,normalizeSpeakingCardIds}=require('../apps/web/app/speak-cards.ts');
const {recommendedLessons}=require('../apps/web/app/learning-profile.ts');
const {journeyTopics}=require('../apps/web/app/journey-content.ts');
test('basic placement starts with words, not the shared conversation deck',()=>{
 const profile={level:'basic',reasons:['travel']};
 assert.equal(recommendedLessons([],profile)[0].category,'Vocabulary');
 const cards=speakingCardsForProfile(profile,[]);
 assert.ok(cards.length>=12);
 assert.ok(cards.every(c=>c.kind==='word'));
 assert.equal(cards[0].lessonId,recommendedLessons([],profile)[0].id);
 assert.deepEqual(normalizeSpeakingCardIds(cards.map(c=>c.id)),cards.map(c=>c.id));
 assert.ok(speakingCardsForProfile({level:'intermediate',reasons:['travel']},[]).some(c=>c.kind==='phrase'));
});
test('vocabulary lessons introduce a word before sentence-level material',()=>{
 const {lessons}=require('../apps/web/app/curriculum.ts');
 for(const topic of journeyTopics){const lesson=lessons.find(l=>l.id===`${topic.id}-words`);assert.equal(lesson.briefing.example,topic.items[0][0]);assert.equal(lesson.briefing.translation,topic.items[0][1]);}
});
test('every placement has a nonempty deck and opening vocabulary has both recorded voices',()=>{
 const manifest=require('../apps/web/app/audio-manifest.json');
 const {lessons}=require('../apps/web/app/curriculum.ts');
 for(const level of ['new','hangul','basic','intermediate','advanced']){
   const cards=speakingCardsForProfile({level,reasons:['family']},[]);
   assert.ok(cards.length,level);
   if(level==='hangul') assert.ok(cards.every(c=>c.kind==='word'));
 }
 for(const id of ['first-readable-words','food-words','home-words','transport-words'])
   for(const word of lessons.find(l=>l.id===id).words)
     for(const voice of ['chris','jessica']) assert.ok(manifest[`${voice}|${word}`],`${voice}: ${word}`);
});
