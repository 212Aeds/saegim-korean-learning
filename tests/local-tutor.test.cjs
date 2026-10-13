const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,p);
test('local tutor uses only loopback, no key or paid budget, and keeps the tutor reply contract',async()=>{
 const env={...process.env},oldFetch=global.fetch;process.env.TUTOR_PROVIDER='local';process.env.PAID_FEATURES_ENABLED='false';delete process.env.OPENROUTER_API_KEY;
 const reply={explanation:'안녕하세요!',hint:'Hello!',nextExercise:'Try saying hello.'};const requests=[];
 try {
  global.fetch=async(url,options)=>{assert.equal(url,'http://127.0.0.1:11434/api/chat');assert.equal(options.headers.Authorization,undefined);const body=JSON.parse(options.body);requests.push(body);assert.equal(body.think,false);assert.equal(body.stream,false);assert.deepEqual(body.format.required,['explanation','hint','nextExercise']);return new Response(JSON.stringify({done:true,done_reason:'stop',message:{content:JSON.stringify(reply)}}));};
  const {OpenRouterTutorProvider}=require('../apps/api/src/tutor/tutor-provider.ts');const provider=new OpenRouterTutorProvider();assert.equal(provider.isAvailable(),true);
  const {TutorService}=require('../apps/api/src/tutor/tutor.service.ts');let budgetCalls=0;const service=new TutorService(provider,{allowAndRecord(){budgetCalls++;throw Error('No paid reservation');}});
  assert.deepEqual(await service.answer('account','Hello','intro'),reply);assert.equal(budgetCalls,0);
  assert.match(requests[0].messages[0].content,/final consonant is placed UNDER/);
  const messages=[{role:'user',content:'안녕하세요'},{role:'assistant',content:'안녕하세요. 이름이 뭐예요?'},{role:'user',content:'저는 민수예요.'}];
  await service.answer('account','저는 민수예요.','conversation',{messages,level:'new',scenario:'friends',consent:true});
  assert.deepEqual(requests[1].messages.slice(1),messages);assert.match(requests[1].messages[0].content,/LEVEL: new/);
  process.env.LOCAL_TUTOR_MODEL='gpt-oss:20b';
  global.fetch=async(url,options)=>{assert.equal(url,'http://127.0.0.1:11434/api/chat');const body=JSON.parse(options.body);assert.equal(body.think,'low');assert.equal(body.model,'gpt-oss:20b');assert.equal(options.headers.Authorization,undefined);return new Response(JSON.stringify({done:true,done_reason:'stop',message:{content:JSON.stringify(reply)}}));};
  assert.deepEqual(await service.answer('account','Hello','intro'),reply);
  global.fetch=async()=>new Response(JSON.stringify({done:true,done_reason:'length',message:{content:JSON.stringify(reply)}}));await assert.rejects(provider.answer({question:'Hello',lessonContext:'intro'}));
 }finally{process.env=env;global.fetch=oldFetch;}
});
