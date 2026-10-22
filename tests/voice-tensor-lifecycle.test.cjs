const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('utterance tensors are released on success and failed synthesis without disposing shared styles',async()=>{
 const made=[];class Tensor{constructor(type,data,dims){Object.assign(this,{type,data,dims,disposed:0});made.push(this);}dispose(){this.disposed++;}}
 const source=fs.readFileSync('apps/web/public/voices/supertonic.js','utf8').replace("import * as ort from './ort/ort.webgpu.bundle.min.mjs';",'const ort=globalThis.__syntheticOrt;');
 globalThis.__syntheticOrt={Tensor};
 try{
 const {TextToSpeech}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const fail of [false,true]){
 made.length=0;const style={ttl:new Tensor('float32',[1],[1]),dp:new Tensor('float32',[1],[1])};let steps=0;
 const out=(name,data)=>({[name]:new Tensor('float32',data,[1])});
 const engine=new TextToSpeech({ae:{sample_rate:24000},ttl:{}},{call:()=>({textIds:[[1]],textMask:[[[1]]]})},{run:async()=>out('duration',[.1])},{run:async()=>out('text_emb',[1])},{run:async()=>{if(fail&&++steps===2)throw Error('Synthetic failure');return out('denoised_latent',[.1]);}},{run:async()=>out('wav_tts',[.2,.3])});
 engine.sampleNoisyLatent=()=>({xt:[[[.1]]],latentMask:[[[1]]]});
 const task=engine._infer(['test'],['ko'],style,3);
 if(fail)await assert.rejects(task,/Synthetic failure/);else assert.deepEqual((await task).wav,[.2,.3]);
 assert.equal(style.ttl.disposed,0);assert.equal(style.dp.disposed,0);
 assert.ok(made.length>8);for(const tensor of made.slice(2))assert.equal(tensor.disposed,1);
 }
 }finally{delete globalThis.__syntheticOrt;}
});
