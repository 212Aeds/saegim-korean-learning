const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {phraseLessons,learningPhrases}=require('../apps/web/app/phrase-lessons.ts');
const {lessons}=require('../apps/web/app/curriculum.ts');
const {speakingCardsForProfile}=require('../apps/web/app/speak-cards.ts');
const {phraseTopics,phrasePage}=require('../apps/web/app/phrase-browser.ts');
test('a short phrase page searches both languages and filters by topic without losing the full deck',()=>{
 const cards=speakingCardsForProfile({level:'intermediate',reasons:['travel']},lessons.map(l=>l.id));
 const snapshot=cards.map(c=>c.id);
 assert.ok(phraseTopics(cards).length>3);
 let page=phrasePage(cards,'','',0);assert.equal(page.cards.length,6);assert.equal(page.total,cards.length);
 const topic=phraseTopics(cards).find(t=>t.id==='phrase-cafe');assert.ok(topic);
 page=phrasePage(cards,topic.id,'포장',0);assert.equal(page.cards.length,1);assert.match(page.cards[0].meaning,/takeaway/);
 assert.equal(phrasePage(cards,topic.id,'TAKEAWAY',0).cards[0].id,page.cards[0].id);
 assert.equal(phrasePage(cards,'','no such phrase',0).total,0);
 assert.equal(phrasePage(cards,'','',999).page,Math.ceil(cards.length/6)-1);
 assert.deepEqual(cards.map(c=>c.id),snapshot);
});
test('every phrase is taught in a small matching lesson with preserved prerequisites',()=>{
 assert.equal(learningPhrases.length,32);assert.equal(phraseLessons.length,8);
 for(const lesson of phraseLessons){assert.ok(lessons.some(l=>l.id===lesson.id));assert.equal(lesson.questions.length,6);assert.ok(lesson.prerequisiteLessonIds.every(id=>lessons.some(l=>l.id===id)));}
 for(const phrase of learningPhrases){const lesson=lessons.find(l=>l.id===phrase.lessonId);assert.ok(lesson.questions.some(q=>q.korean===phrase.korean&&q.answer===phrase.meaning));}
});
test('new phrases respect placement and alphabet-first learning',()=>{
 const all=lessons.map(l=>l.id);
 for(const level of ['new','hangul'])assert.ok(!speakingCardsForProfile({level,reasons:['travel']},all).some(c=>c.id.startsWith('speak-phrase-')));
 assert.ok(speakingCardsForProfile({level:'basic',reasons:['travel']},[]).every(c=>c.kind==='word'));
 const basic=speakingCardsForProfile({level:'basic',reasons:['travel']},all);
 for(const p of learningPhrases.filter(p=>p.level==='foundation'))assert.ok(basic.some(c=>c.korean===p.korean));
 const intermediate=speakingCardsForProfile({level:'intermediate',reasons:['travel']},all);
 for(const p of learningPhrases.filter(p=>p.level==='intermediate'))assert.ok(intermediate.some(c=>c.korean===p.korean));
 const advanced=speakingCardsForProfile({level:'advanced',reasons:['travel']},[]);assert.equal(advanced.length,16);assert.ok(advanced.every(c=>c.id.startsWith('speak-opinion-')));
});
