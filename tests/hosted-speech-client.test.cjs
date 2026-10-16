const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
test('hosted speech sends authenticated consented WAV to the same-origin API and never localhost',async()=>{
 const old={...process.env},fetch=global.fetch;
 try{Object.assign(process.env,{NEXT_PUBLIC_FREE_PUBLISHING:'false',NEXT_PUBLIC_HOSTED_AI_ENABLED:'true',NEXT_PUBLIC_API_URL:'/api'});delete process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL;
 const {localSpeechAvailable,transcribeOnLocalServer}=require('../apps/web/app/ui/local-speech-server.ts');const calls=[];
 global.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(url.endsWith('/status')?{transcription:true,synthesis:false}:{transcript:'안녕하세요'}));};
 assert.equal(await localSpeechAvailable(),true);
 const raw=new ArrayBuffer(46),view=new DataView(raw);const text=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i))};text(0,'RIFF');text(8,'WAVE');text(12,'fmt ');text(36,'data');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint16(34,16,true);view.setUint32(40,2,true);
 assert.equal(await transcribeOnLocalServer(new Blob([raw],{type:'audio/wav'})),'안녕하세요');assert.equal(calls[0].url,'/api/v1/speech/status');assert.equal(calls[1].url,'/api/v1/speech/transcribe');assert.equal(calls[1].options.credentials,'include');assert.equal(calls[1].options.headers['X-Saegim-Speech-Consent'],'true');assert.equal(calls[1].options.body.type,'audio/wav');assert.equal(calls[1].options.body.size,46);
 }finally{global.fetch=fetch;process.env=old;}
});

test('static build configuration only enables hosted AI in the explicit hosted mode',()=>{
 const old={...process.env},file=require.resolve('../apps/web/next.config.ts');
 try{
 Object.assign(process.env,{STATIC_PUBLISH:'true',SAEGIM_HOSTED_AI:'true',NEXT_PUBLIC_FREE_PUBLISHING:'true',NEXT_PUBLIC_API_URL:'/api'});delete require.cache[file];let config=require(file).default;assert.equal(config.env.NEXT_PUBLIC_FREE_PUBLISHING,'true');assert.equal(config.env.NEXT_PUBLIC_API_URL,'');assert.equal(config.env.NEXT_PUBLIC_HOSTED_AI_ENABLED,'false');
 process.env.NEXT_PUBLIC_FREE_PUBLISHING='false';delete require.cache[file];config=require(file).default;assert.equal(config.env.NEXT_PUBLIC_HOSTED_AI_ENABLED,'true');assert.equal(config.env.NEXT_PUBLIC_API_URL,'/api');assert.equal(config.env.NEXT_PUBLIC_LOCAL_SPEECH_URL,'');assert.equal(config.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED,'false');
 }finally{delete require.cache[file];process.env=old;}
});
