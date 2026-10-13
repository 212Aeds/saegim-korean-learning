const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,p);
test('existing provider keys cannot enable paid calls without explicit opt-in',async()=>{
 const old={...process.env},original=global.fetch;let calls=0;process.env.OPENROUTER_API_KEY='test';process.env.OPENROUTER_AUDIO_ENABLED='true';delete process.env.PAID_FEATURES_ENABLED;global.fetch=async()=>{calls++;throw Error('Must not call provider')};
 try{const {OpenRouterTutorProvider}=require('../apps/api/src/tutor/tutor-provider.ts'),{OpenRouterKoreanSpeechProvider}=require('../apps/api/src/speech/speech-provider.ts');const tutor=new OpenRouterTutorProvider(),speech=new OpenRouterKoreanSpeechProvider();assert.equal(tutor.isAvailable(),false);assert.equal(speech.isAvailable(),false);await assert.rejects(tutor.answer({question:'Hello',lessonContext:'test'}));await assert.rejects(speech.synthesize('안녕하세요','jessica'));assert.equal(calls,0);}finally{global.fetch=original;process.env=old;}
});
test('free static release overrides client paid flags and remote API configuration',()=>{
 const old={...process.env};process.env.NEXT_PUBLIC_FREE_PUBLISHING='true';process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED='true';process.env.NEXT_PUBLIC_API_URL='https://api.example.invalid';
 try{const p=require.resolve('../apps/web/app/release.ts');delete require.cache[p];const r=require(p);assert.equal(r.paidFeaturesEnabled,false);assert.equal(r.publicApiUrl,undefined);assert.notEqual(r.deviceProgressKey,'sori-progress');delete require.cache[p];}finally{process.env=old;}
});
test('free listening never contacts a provider when the device has no voice',async()=>{
 const original=global.fetch,oldWindow=global.window;let calls=0;global.window={};global.fetch=async()=>{calls++;throw Error('Unexpected paid request')};
 try{const {playElevenLabsKorean,playKorean}=require('../apps/web/app/ui/speech.ts');assert.deepEqual(await playElevenLabsKorean('안녕하세요','chris',1,{naturalOnly:true}),{played:false,source:'unavailable'});assert.deepEqual(await playKorean('안녕하세요'),{played:false,source:'unavailable'});assert.equal(calls,0);}finally{global.fetch=original;if(oldWindow===undefined)delete global.window;else global.window=oldWindow;}
});
