const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,p);
const {TutorService}=require('../apps/api/src/tutor/tutor.service.ts');
test('foundational Hangul composition answers use checked lesson facts even when AI is unavailable',async()=>{
 const service=new TutorService({isAvailable:()=>false,answer:()=>{throw Error('Must not generate checked facts');}},{allowFreeInference:()=>{throw Error('Must not spend model quota');}});
 for(const question of ['How do I build a Hangul syllable?','Can a written Hangul syllable block contain only one letter? Explain using 아.']){
 const answer=await service.answer('test-account',question,'Beginning Hangul');
 assert.match(answer.explanation,/initial consonant and a vowel/);assert.match(answer.explanation,/ㅇ \+ ㅏ = 아/);assert.match(answer.explanation,/final consonant is optional/);assert.ok(answer.explanation.length<=500);
 }
});
test('checked answers do not intercept unrelated Korean questions or conversation practice',async()=>{
 const {checkedHangulAnswer}=require('../apps/api/src/tutor/lesson-grounding.ts');
 for(const q of ['Why is Korean hard?','How do I pronounce Hangul syllables?','Build a cafe conversation.'])assert.equal(checkedHangulAnswer(q),null);
 const service=new TutorService({isAvailable:()=>false},{});
 await assert.rejects(service.answer('test','How do I build a Hangul syllable?','Hangul',{messages:[{role:'user',content:'Hello'}],level:'new',consent:true}),/unavailable/);
});

test('common polite greeting questions use a stable lesson answer without inference or quota',async()=>{
 const service=new TutorService({isAvailable:()=>false,answer:()=>{throw Error('Must not call inference');}},{allowFreeInference:()=>{throw Error('Must not spend quota');}});
 const answer=await service.answer('test-account','How do I say hello politely in Korean?','Greetings');
 assert.match(answer.explanation,/안녕하세요/);assert.match(answer.hint,/National Institute of Korean Language/);
 const {tutorAnswerSchema}=require('../apps/api/src/tutor/tutor.schema.ts');assert.equal(tutorAnswerSchema.safeParse(answer).success,true);
 await assert.rejects(service.answer('test-account','How do I say hello politely in Korean and introduce myself?','Greetings'),/unavailable/);
});
