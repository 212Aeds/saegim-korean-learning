const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {matchesPracticeAnswer}=require('../apps/web/app/ui/speech-check.ts');
test('practice accepts the supplied romanization and Korean without accepting mixed scripts or numbers',()=>{
 for(const answer of ['나무','namu','NAMU','na-mu',' namu! ']) assert.equal(matchesPracticeAnswer('나무',answer,'namu'),true,answer);
 for(const answer of ['namu123','namu가','namu💰','nami','']) assert.equal(matchesPracticeAnswer('나무',answer,'namu'),false,answer);
 assert.equal(matchesPracticeAnswer('나무','namu'),false);
 assert.equal(matchesPracticeAnswer('ㄱ','g'),true);
});

test('daughter sound cue is accepted, but moon is never silently substituted for daughter',()=>{
 const {speechContrastHint,practiceAnswerNote}=require('../apps/web/app/ui/speech-check.ts');
 for(const answer of ['딸','ttal','ddal',' DDAL '])assert.equal(matchesPracticeAnswer('딸',answer,'ttal'),true,answer);
 for(const answer of ['달','dal','탈','tal'])assert.equal(matchesPracticeAnswer('딸',answer,'ttal'),false,answer);
 assert.match(practiceAnswerNote('딸','ddal'),/ttal/);
 assert.match(speechContrastHint('딸','달.'),/Recognition can confuse/);
 assert.equal(speechContrastHint('딸','딸'),'');assert.equal(speechContrastHint('거실','교실'),'');
 const {speechAttempt}=require('../apps/web/app/ui/speech-attempt.ts');
 assert.deepEqual(speechAttempt('딸','달','ttal','speech'),{matches:false,needsConfirmation:true,submit:false});
});
