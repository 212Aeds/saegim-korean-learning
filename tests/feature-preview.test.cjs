const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {previewStorageKey,readPreviewPhrases,addPreviewPhrase,greetingLesson,introductionLesson,greeting,thanks,apology,closingPhrase}=require('../apps/web/app/feature-preview/model.ts');
test('conversation branches reuse existing authored lesson material',()=>{
 assert.ok(greetingLesson.questions.includes(greeting));assert.ok(greetingLesson.questions.includes(thanks));assert.ok(greetingLesson.questions.includes(apology));
 assert.equal(closingPhrase('introduce').korean,introductionLesson.briefing.example);assert.equal(closingPhrase('thank').korean,thanks.korean);assert.notEqual(closingPhrase('introduce').korean,closingPhrase('thank').korean);
});
test('phrasebook is bounded, deduplicated and restored without touching real progress',()=>{
 assert.match(previewStorageKey,/feature-preview/);assert.deepEqual(readPreviewPhrases('{bad'),[]);assert.deepEqual(readPreviewPhrases('{}'),[]);
 const phrase={korean:'안녕하세요',meaning:'Hello'};const first=addPreviewPhrase([],phrase);assert.equal(first.items.length,1);
 assert.equal(addPreviewPhrase(first.items,phrase).items.length,1);assert.deepEqual(readPreviewPhrases(JSON.stringify([phrase,phrase,{korean:7,meaning:'bad'},{korean:'x',meaning:''}])),[phrase]);
 assert.equal(addPreviewPhrase([],{korean:'x'.repeat(121),meaning:'test'}).items.length,0);
 const full=Array.from({length:30},(_,i)=>({korean:'phrase'+i,meaning:'note'}));assert.equal(addPreviewPhrase(full,phrase).items.length,30);
 assert.equal(readPreviewPhrases(JSON.stringify([...full,phrase])).length,30);
});
test('public route is disabled without local opt-in, with no account progress writer or AI calls',()=>{
 const page=fs.readFileSync('apps/web/app/feature-preview/page.tsx','utf8'),ui=fs.readFileSync('apps/web/app/feature-preview/preview.tsx','utf8');
 assert.match(page,/SAEGIM_FEATURE_PREVIEW!=="true"\)notFound\(\)/);assert.doesNotMatch(ui,/fetch\(|getUserMedia|v1\/|sori-progress|saegim-device-progress/);
 assert.match(ui,/This is a good place to stop/);assert.match(ui,/WordReference/);assert.match(ui,/return\(\)=>audio\?.pause\(\)/);
});

test('both conversation branches have recorded Chris and Jessica clips',()=>{
 const {recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');
 for(const branch of ['introduce','thank'])for(const voice of ['chris','jessica'])assert.ok(recordedAudioUrl(closingPhrase(branch).korean,voice),`${branch} / ${voice}`);
});
