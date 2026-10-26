const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,p);
const {cloudflareAvailable,cloudflareRequest}=require('../apps/api/src/cloudflare-ai.ts');
test('provider diagnostics record a synthetic 429 and recovery without retaining payloads',async()=>{
 const old={...process.env},fetch=global.fetch;
 try{
  Object.assign(process.env,{CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'synthetic-secret',CLOUDFLARE_FREE_PLAN_CONFIRMED:'true'});
  const {providerResults}=require('../apps/api/src/provider-health.ts');
  global.fetch=async()=>new Response('synthetic private error text',{status:429});
  await assert.rejects(cloudflareRequest('tutor',{prompt:'synthetic learner text'}));
  assert.equal(providerResults().tutor.state,'limited');assert.ok(!JSON.stringify(providerResults()).includes('synthetic'));
  global.fetch=async()=>new Response(JSON.stringify({success:true,result:{text:'fixture'}}));
  await cloudflareRequest('tutor',{});assert.equal(providerResults().tutor.state,'success');
 }finally{global.fetch=fetch;process.env=old;}
});
test('Cloudflare requires explicit free-plan confirmation and never falls back after quota errors',async()=>{
 const old={...process.env},fetch=global.fetch;let calls=0;
 try{process.env.CLOUDFLARE_ACCOUNT_ID='a'.repeat(32);process.env.CLOUDFLARE_API_TOKEN='test-secret';delete process.env.CLOUDFLARE_FREE_PLAN_CONFIRMED;assert.equal(cloudflareAvailable(),false);global.fetch=async()=>{calls++;return new Response('{}',{status:429})};await assert.rejects(cloudflareRequest('whisper',{}));assert.equal(calls,0);process.env.CLOUDFLARE_FREE_PLAN_CONFIRMED='true';assert.equal(cloudflareAvailable(),true);await assert.rejects(cloudflareRequest('whisper',{}),/unavailable/);assert.equal(calls,1);
 }finally{global.fetch=fetch;process.env=old;}
});
test('Cloudflare requests use fixed models, bounded responses and server-only authorization',async()=>{
 const old={...process.env},fetch=global.fetch;let request;
 try{Object.assign(process.env,{CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'secret',CLOUDFLARE_FREE_PLAN_CONFIRMED:'true'});global.fetch=async(url,options)=>{request={url,options};return new Response(JSON.stringify({success:true,result:{text:'안녕하세요'}}))};assert.deepEqual(await cloudflareRequest('whisper',{audio:'test'}),{text:'안녕하세요'});assert.match(request.url,/api.cloudflare.com\/client\/v4\/accounts\/[a-f0-9]{32}\/ai\/run\/@cf\/openai\/whisper-large-v3-turbo$/);assert.equal(request.options.headers.Authorization,'Bearer secret');assert.equal(request.options.redirect,'error');global.fetch=async()=>new Response('x'.repeat(65537));await assert.rejects(cloudflareRequest('whisper',{}),/large/);global.fetch=async()=>new Response(JSON.stringify({success:false,result:{text:'no'}}));await assert.rejects(cloudflareRequest('whisper',{}));
 }finally{global.fetch=fetch;process.env=old;}
});

test('Cloudflare tutor and transcription adapters validate outputs and refuse synthesis without a paid fallback',async()=>{
 const old={...process.env},fetch=global.fetch;const calls=[];
 try{
 Object.assign(process.env,{CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'secret',CLOUDFLARE_FREE_PLAN_CONFIRMED:'true',TUTOR_PROVIDER:'cloudflare',SPEECH_PROVIDER:'cloudflare',PAID_FEATURES_ENABLED:'false',PROVIDER_TERMS_REVIEWED:'true'});
 const {OpenRouterTutorProvider}=require('../apps/api/src/tutor/tutor-provider.ts'),{OpenRouterKoreanSpeechProvider}=require('../apps/api/src/speech/speech-provider.ts'),{SpeechController}=require('../apps/api/src/speech/speech.controller.ts');
 const reply={explanation:'안녕하세요. 이름이 뭐예요?',hint:'Hello. What is your name?',nextExercise:'Try answering with your name.'};
 global.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return new Response(JSON.stringify({success:true,result:url.includes('whisper')?{text:'이거 얼마예요?'}:{response:JSON.stringify(reply)}}));};
 const tutor=new OpenRouterTutorProvider(),speech=new OpenRouterKoreanSpeechProvider();assert.deepEqual(await tutor.answer({question:'Hello',lessonContext:'basic'}),reply);assert.match(calls[0].body.messages[0].content,/Checked lesson facts/);assert.match(calls[0].body.messages[0].content,/silent placeholder/);assert.deepEqual(await speech.transcribe(new Uint8Array([1,2]),'audio/wav','ko-KR'),{transcript:'이거 얼마예요?'});assert.equal(calls[1].body.language,'ko');assert.equal(calls[1].body.initial_prompt,undefined);assert.equal(calls[1].body.audio,'AQI=');await assert.rejects(speech.synthesize('안녕하세요','chris'));assert.equal(calls.length,2);assert.ok(calls.every(call=>call.url.startsWith('https://api.cloudflare.com/')));
 assert.equal(new SpeechController(speech,{},{}).status().synthesis,false);
 global.fetch=async()=>new Response(JSON.stringify({success:true,result:{response:reply}}));assert.deepEqual(await tutor.answer({question:'Hello',lessonContext:'basic'}),reply);
 global.fetch=async()=>new Response(JSON.stringify({success:true,result:{response:JSON.stringify({...reply,explanation:'<script>bad</script>'})}}));await assert.rejects(tutor.answer({question:'Hello',lessonContext:'basic'}));
 }finally{global.fetch=fetch;process.env=old;}
});
test('free hosted reservations use persistent atomic limits and fail closed without billing writes',async()=>{
 const {ProviderUsageService}=require('../apps/api/src/provider-usage.service.ts');const calls=[];let reason=null;
 const usage=new ProviderUsageService({query:async(sql,values)=>{calls.push({sql,values});return {rows:[{reason}]};}});
 assert.equal((await usage.allowFreeInference('00000000-0000-4000-8000-000000000001')).allowed,true);assert.match(calls[0].sql,/reserve_tutor_request/);assert.doesNotMatch(calls[0].sql,/spend/);reason='account-limit';assert.equal((await usage.allowFreeInference('00000000-0000-4000-8000-000000000001')).reason,'account-limit');assert.equal((await usage.allowFreeInference('invalid')).allowed,false);
 const broken=new ProviderUsageService({query:async()=>{throw Error('offline')}});assert.equal((await broken.allowFreeInference('00000000-0000-4000-8000-000000000001')).allowed,false);
});
