import {readVoiceAsset} from './read-asset.js';
import * as ort from './ort/ort.webgpu.bundle.min.mjs';
import {TextToSpeech,UnicodeProcessor,Style,writeWavFile} from './supertonic.js';

ort.env.wasm.numThreads=1;
ort.env.wasm.wasmPaths=new URL('./ort/',import.meta.url).href;
ort.env.logLevel='error';
let engine,styles,loaded=0,total=1,cache,manifest;
let lastReport=0,lastMessage='';
const report=message=>{const now=performance.now();if(message===lastMessage&&now-lastReport<200)return;lastReport=now;lastMessage=message;postMessage({type:'progress',message,progress:Math.min(99,Math.floor(loaded/total*100))});};
async function asset(name) {
  const expected=manifest.files[name],url=manifest.base+(expected.path??name);
  let response;try{response=await cache?.match(url);}catch{}
  let bytes;
  if(response){bytes=await response.arrayBuffer();if(!await valid(bytes,expected)){try{await cache?.delete(url);}catch{}bytes=undefined;}}
  if(!bytes){
    response=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw Error('The voice download could not finish. Please try again.');
    bytes=await readVoiceAsset(response,expected.bytes,count=>{loaded+=count;report('Downloading Chris and Jessica…');});
    if(!await valid(bytes,expected))throw Error('Voice file verification failed. Please retry.');
    try{await cache?.put(url,new Response(bytes));}catch{/* Private browsing/storage limits must not prevent this visit's playback. */}
  }else{loaded+=expected.bytes;report('Loading saved voices…');}
  return bytes;
}
async function valid(bytes,expected){if(bytes.byteLength!==expected.bytes)return false;const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')===expected.sha256;}
async function initialize(profile){
  if(engine)return;
  manifest=await (await fetch(profile==='mobile'?'./mobile-model-manifest.json':'./model-manifest.json')).json();
  total=Object.values(manifest.files).reduce((sum,file)=>sum+file.bytes,0);loaded=0;
  try{cache=await caches.open('saegim-supertonic-'+manifest.revision);}catch{}
  const json=async name=>JSON.parse(new TextDecoder().decode(await asset(name)));
  const config=await json('onnx/tts.json'),indexer=await json('onnx/unicode_indexer.json');
  styles={};for(const [voice,preset] of [['chris','M1'],['jessica','F1']]){const style=await json('voice_styles/'+preset+'.json');styles[voice]=new Style(new ort.Tensor('float32',Float32Array.from(style.style_ttl.data.flat(Infinity)),style.style_ttl.dims),new ort.Tensor('float32',Float32Array.from(style.style_dp.data.flat(Infinity)),style.style_dp.dims));}
  const sessions=[];
  try{
    for(const file of ['duration_predictor','text_encoder','vector_estimator','vocoder']){
      const bytes=await asset('onnx/'+file+'.onnx');report('Preparing '+file.replaceAll('_',' ')+'…');
      // Prefer device acceleration; CPU/WASM remains available in the worker.
      let session;
      if(profile!=='mobile'&&self.navigator.gpu){try{session=await ort.InferenceSession.create(bytes,{executionProviders:['webgpu','wasm'],graphOptimizationLevel:'all'});}catch{}}
      sessions.push(session??await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'}));
    }
    engine=new TextToSpeech(config,new UnicodeProcessor(indexer),...sessions);
    // Sessions are ready now. Generate only audio the learner requested;
    // a warm-up can stall at 99% and must not gate every chat control.

  }catch(error){engine=undefined;await Promise.allSettled(sessions.map(session=>session.release()));throw error;}
}
function finish(samples,rate){
  const output=new Float32Array(Math.floor(rate*.12)+samples.length+Math.floor(rate*.3));
  let peak=0,sum=0,count=0;for(const x of samples){if(!Number.isFinite(x))throw Error('Invalid generated audio.');peak=Math.max(peak,Math.abs(x));}
  for(const x of samples)if(Math.abs(x)>peak*.02){sum+=x*x;count++;}
  const gain=peak>.0001?Math.min(2,.12/Math.max(Math.sqrt(sum/Math.max(1,count)),.0001),.8912/peak):1;
  const fade=Math.min(Math.floor(rate*.005),Math.floor(samples.length/2)),head=Math.floor(rate*.12);
  for(let i=0;i<samples.length;i++){const envelope=fade?Math.min(1,i/Math.max(1,fade-1),(samples.length-1-i)/Math.max(1,fade-1)):1;output[head+i]=samples[i]*gain*envelope;}
  return output;
}
let busy=false;
onmessage=async({data})=>{
  if(busy){postMessage({id:data.id,type:'error',message:'A voice request is already running.'});return;}
  busy=true;
  try{
    if(data.type==='initialize'){await initialize(data.profile);postMessage({id:data.id,type:'ready'});}
    else if(data.type==='synthesize'){
      if(!engine||!['chris','jessica'].includes(data.voice)||typeof data.text!=='string'||!/[가-힣]/u.test(data.text)||data.text.length>500)throw Error('Set up the conversation voices first.');
      report('Preparing your partner’s voice…');
      const text=/[.!?。！？]$/u.test(data.text)?data.text:data.text+'.';
      const result=await engine.call(text,'ko',styles[data.voice],16,.9,.25,(step,total)=>report('Creating voice · '+step+' of '+total+'…'));
      const wav=writeWavFile(finish(result.wav,engine.sampleRate),engine.sampleRate);
      if(wav.byteLength>5*1024*1024)throw Error('This spoken reply is too long.');
      postMessage({id:data.id,type:'audio',wav},[wav]);
    }
  }catch(error){postMessage({id:data.id,type:'error',detail:data.type==='initialize'?String(error.message).slice(0,200):undefined,message:'These voices could not run on this device. Retry setup, or continue by text.'});}
  finally{busy=false;}
};
