const fs=require('fs'),ts=require('typescript');require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);const {test}=require('node:test'),assert=require('node:assert/strict');
const {journeyLessons,journeyVocabulary,journeyTopics}=require('../apps/web/app/journey-content.ts');const {lessons}=require('../apps/web/app/curriculum.ts');const {recommendedLessons,learningRoute}=require('../apps/web/app/learning-profile.ts');const {conversationRequestSchema}=require('../apps/api/src/tutor/tutor.schema.ts');const refs=require('../apps/web/app/word-reference-index.json');
test('themed expansion has 40 courses, 120 vocabulary items, references, and valid distinct choices',()=>{assert.equal(journeyLessons.length,40);assert.equal(journeyVocabulary.length,120);assert.equal(new Set(journeyVocabulary.map(w=>w.korean)).size,120);assert.equal(journeyTopics.length,20);for(const word of journeyVocabulary){assert.ok(refs.lines[word.korean],word.korean);assert.equal(word.reviewStatus,'editor_review_required');assert.ok(word.exampleTranslation);}for(const course of journeyLessons){assert.ok(course.prerequisiteLessonIds.every(id=>lessons.some(l=>l.id===id)),course.id);for(const q of course.questions){assert.notEqual(q.korean,'?');if(q.type==='choice'){assert.ok(q.choices.includes(q.answer));assert.equal(new Set(q.choices).size,q.choices.length);}}}});
test('advanced placement and expanded interests guide routes without granting completion',()=>{const advanced={level:'advanced',reasons:['exams','food','living','friends']};assert.equal(recommendedLessons([],advanced)[0].id,'opinions-dialogue');assert.equal(conversationRequestSchema.safeParse({messages:[{role:'user',content:'안녕하세요'}],level:'advanced',consent:true}).success,true);const newFood=learningRoute({level:'new',reasons:['food']});assert.equal(newFood[0].id,'hangul-first-sounds');assert.ok(newFood.findIndex(l=>l.id==='food-words')>newFood.findIndex(l=>l.id==='hello-there'));});


test('new topic chains stay behind reading, preserve recall order, and reach speaking practice',()=>{
 const {isLessonUnlocked}=require('../apps/web/app/learning-pathways.ts');
 const {placementKnowledge}=require('../apps/web/app/learning-profile.ts');
 const {speakingCardsForProfile}=require('../apps/web/app/speak-cards.ts');
 const full=speakingCardsForProfile({level:'advanced',reasons:['family','food']},lessons.map(l=>l.id));
 for(const id of ['family','fruit','table','outdoors']){
  const chain=['words','word-recall','dialogue','consolidation'].map(stage=>lessons.find(l=>l.id===`${id}-${stage}`));
  assert.equal(chain.filter(Boolean).length,4);assert.equal(isLessonUnlocked(chain[0],[]),false);
  const profile={level:'basic',reasons:['family','food']},route=learningRoute(profile).map(l=>l.id);
  for(let index=1;index<chain.length;index++)assert.ok(route.indexOf(chain[index-1].id)<route.indexOf(chain[index].id));
  assert.equal(isLessonUnlocked(chain[2],[],placementKnowledge(profile)),false);
  for(const word of chain[0].words)assert.ok(full.some(card=>card.korean===word),word);
  assert.ok(chain[0].briefing.watchFor,'contextual usage notes should appear in the introduction');
 }
});

test('new word recall accepts common English equivalents without accepting a different sense',()=>{
 const {isCorrectTextAnswer}=require('../apps/web/app/curriculum.ts');
 for(const [id,word,variant] of [['family','할머니','grandma'],['fruit','포도','grapes'],['fruit','배','pears'],['table','컵','cups'],['outdoors','꽃','flowers']]){
  const q=lessons.find(l=>l.id===`${id}-word-recall`).questions.find(q=>q.korean===word);
  assert.equal(isCorrectTextAnswer(q,variant),true,variant);
 }
 const pear=lessons.find(l=>l.id==='fruit-word-recall').questions.find(q=>q.korean==='배');assert.equal(isCorrectTextAnswer(pear,'boat'),false);
});
