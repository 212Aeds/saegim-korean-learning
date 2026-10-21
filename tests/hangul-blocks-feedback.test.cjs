const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {eligibleHangulBlocks,composeHangulBlock}=require('../apps/web/app/ui/hangul-blocks.ts');
const {defaultLearningProfile}=require('../apps/web/app/learning-profile.ts');
const {feedbackFormUrl}=require('../apps/web/app/ui/feedback-form-url.ts');
const {makeFeedbackReport}=require('../apps/web/app/ui/feedback-report-text.ts');
test('new learners start with the first lesson letters; new combinations require letter exposure',()=>{
 assert.deepEqual(eligibleHangulBlocks([],defaultLearningProfile).map(sample=>sample.korean),['가']);
 assert.deepEqual(eligibleHangulBlocks(['unknown','hangul-first-sounds'],defaultLearningProfile).map(sample=>sample.korean),['가']);
 const vowels=eligibleHangulBlocks(['hangul-core-vowels'],defaultLearningProfile);
 assert.ok(vowels.length>1);assert.ok(vowels.every(sample=>sample.letters[0]==='ㄱ'&&'ㅏㅓㅣ'.includes(sample.letters[1])));
 const placed=eligibleHangulBlocks([],{...defaultLearningProfile,level:'hangul'});assert.ok(placed.length>1);
 const {recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');
 for(const sample of placed){assert.equal(sample.letters.length,2);assert.equal(composeHangulBlock(...sample.letters),sample.korean);for(const voice of ['chris','jessica'])assert.ok(recordedAudioUrl(sample.korean,voice),`${voice}: ${sample.korean} needs recorded audio`);}
});
test('composition builds Hangul, rejects invalid input and does not mistake a final consonant cluster for an initial',()=>{
 assert.equal(composeHangulBlock('ㄱ','ㅏ'),'가');assert.equal(composeHangulBlock('ㄴ','ㅓ'),'너');assert.equal(composeHangulBlock('ㄱ','ㅗ'),'고');
 for(const pair of [['g','a'],['ㄱ',''],['ㄳ','ㅏ'],['ㄱㄴ','ㅏ']])assert.equal(composeHangulBlock(...pair),'');
});
test('prepared feedback fills only explicit report text and anonymous name, safely encoding punctuation and Korean',()=>{
 const report=makeFeedbackReport({title:'Audio & Korean',steps:'The sound stops after 안녕하세요.',expected:'Play the whole phrase.',area:'speak',publishing:false,hosted:true,email:'private@example.test',password:'private-secret'});
 const url=new URL(feedbackFormUrl(report,'speak'));
 assert.equal(url.origin,'https://docs.google.com');assert.equal(url.searchParams.get('entry.1690404554'),report);assert.equal(url.searchParams.get('entry.1870422208'),'speak');assert.equal(url.searchParams.get('entry.668089580'),'Anonymous Saegim learner');
 assert.ok(!url.toString().includes('private-secret'));assert.ok(!url.toString().includes('private%40example'));assert.equal(url.pathname.endsWith('/viewform'),true);assert.ok(!url.pathname.includes('formResponse'));
});
test('feedback handoff is explicit and no longer requires downloads or clipboard access',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/feedback-report.tsx','utf8');assert.match(ui,/Review &amp; send report/);assert.match(ui,/press Submit there/);assert.doesNotMatch(ui,/createObjectURL|navigator.clipboard|Copy report|Download report|fetch\(/);
});
