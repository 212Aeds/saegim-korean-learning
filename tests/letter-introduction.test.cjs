const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {lessonLetterIntroduction}=require('../apps/web/app/ui/lesson-questions.ts');
const {hangulLetters}=require('../apps/web/app/more-lessons.ts');
const {recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');
test('each Hangul letter has a concise introduction and both packaged sample voices',()=>{
 for(const letter of hangulLetters){const intro=lessonLetterIntroduction({korean:letter.korean},{category:'Hangul'});
  assert.ok(intro,letter.korean);assert.equal(intro.id,`letter-${letter.korean}`);assert.ok(intro.explanation.includes(letter.romanization.trim()));
  for(const voice of ['chris','jessica'])assert.ok(recordedAudioUrl(intro.audioText,voice),`${letter.korean}: ${voice}`);
 }
 const eo=lessonLetterIntroduction({korean:'ㅓ'},{category:'Hangul'});assert.match(eo.explanation,/romanized.*eo/);assert.equal(eo.audioText,'어');
 assert.equal(lessonLetterIntroduction({korean:'거'},{category:'Hangul'}),null);
 assert.equal(lessonLetterIntroduction({korean:'ㅓ'},{category:'Vocabulary'}),null);
 assert.equal(lessonLetterIntroduction(undefined,{category:'Hangul'}),null);
});
