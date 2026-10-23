const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,p);
const {TutorService}=require('../apps/api/src/tutor/tutor.service.ts');
test('conversation teaching notes cannot repeat a generated false grammar rule or pronunciation verdict',async()=>{
 const old={...process.env};process.env.TUTOR_PROVIDER='local';
 const original={explanation:'어떤 책을 좋아하세요?',hint:'What books do you like?',nextExercise:'좋아하는 is more formal than 좋아해요. Your pronunciation is perfect.'};
 const provider={isAvailable:()=>true,answer:async()=>({...original})};const service=new TutorService(provider,{});
 try{const conversation={level:'basic',messages:[{role:'user',content:'저는 책을 좋아해요.'}],consent:true};const reply=await service.answer('synthetic','저는 책을 좋아해요.','',conversation);
 assert.equal(reply.explanation,original.explanation);assert.equal(reply.hint,original.hint);assert.doesNotMatch(reply.nextExercise,/more formal|pronunciation is perfect/);assert.match(reply.nextExercise,/좋아하는 책/);
 const fallback=await service.answer('synthetic','안녕하세요','',{...conversation,messages:[{role:'user',content:'안녕하세요'}]});assert.doesNotMatch(fallback.nextExercise,/pronunciation|more formal/);
 assert.deepEqual(await service.answer('synthetic','Explain a pattern',''),original);
 }finally{process.env=old;}
});

test('the known formality misconception has a sourced answer without an AI request',async()=>{
 const {TutorService}=require('../apps/api/src/tutor/tutor.service.ts');let calls=0;
 const service=new TutorService({isAvailable:()=>true,answer:async()=>{calls++;throw Error('should use checked explanation');}},{});
 const reply=await service.answer('synthetic','Is 좋아하는 more formal than 좋아해요?','');
 assert.equal(calls,0);assert.match(reply.explanation,/modifies a following noun/);assert.match(reply.hint,/NIKL/);
});
