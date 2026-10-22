const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {practicePool}=require('../apps/web/app/practice-bank.ts');
const {initialProgress}=require('../apps/web/app/progress.ts');
const {defaultLearningProfile}=require('../apps/web/app/learning-profile.ts');
const {isCorrectTextAnswer}=require('../apps/web/app/curriculum.ts');
const {matchesPracticeAnswer}=require('../apps/web/app/ui/speech-check.ts');
test('또 reading accepts the requested sound cue, explains standard spelling, and keeps writing strict',()=>{
 const pool=practicePool(initialProgress,{...defaultLearningProfile,level:'hangul'},'mixed');
 const reading=pool.find(c=>c.question.id==='drill-read-또').question;
 assert.equal(isCorrectTextAnswer(reading,'ddo'),true);assert.equal(isCorrectTextAnswer(reading,'tto'),true);assert.match(reading.tip,/Standard romanization: tto/);
 assert.equal(matchesPracticeAnswer('또','ddo','tto'),true);assert.equal(matchesPracticeAnswer('도','ddo','do'),false);
 const writing=pool.find(c=>c.question.id==='drill-build-또').question;
 assert.equal(isCorrectTextAnswer(writing,'ddo'),false);assert.equal(isCorrectTextAnswer(writing,'또'),true);
});
test('living-room recognition tolerates separators, but never swaps classroom or invents a correct transcript',()=>{
 for(const input of ['거실','거 실.','geosil','geo-sil'])assert.equal(matchesPracticeAnswer('거실',input,'geosil'),true,input);
 for(const input of ['교실','gosil','','거실에서'])assert.equal(matchesPracticeAnswer('거실',input,'geosil'),false,input);
});
test('stop-and-check UI distinguishes checking from an inactive microphone and shares matching voices',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/server-speech-practice.tsx','utf8');
 assert.match(ui,/finish.current=stop \? \(\)=>\{setState\("checking"\)/);
 assert.doesNotMatch(ui,/"Microphone off"/);assert.match(ui,/<MatchingVoiceSetup text=\{korean\} voice=\{voice\}/);
 const page=fs.readFileSync('apps/web/app/page.tsx','utf8');assert.match(page,/preloadVoiceFiles/);assert.doesNotMatch(page,/prepareBrowserVoicesAutomatically/);assert.doesNotMatch(page,/browserVoicesConsented/);
});
