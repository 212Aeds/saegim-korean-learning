const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {MicrophoneActivity,recordingPauseMs}=require('../apps/web/app/ui/microphone-activity.ts');
function tone(hz,amplitude,rate=48000){return Float32Array.from({length:4800},(_,i)=>amplitude*Math.sin(2*Math.PI*hz*i/rate));}
test('steady ambient noise calibrates without being treated as speech; louder voice is retained',()=>{
 const mic=new MicrophoneActivity(48000);const ambient=tone(220,.003);
 for(let i=0;i<3;i++)assert.equal(mic.process(ambient).speaking,false);
 assert.equal(mic.ready,true);
 for(let i=0;i<20;i++)assert.equal(mic.process(ambient).speaking,false);
 assert.equal(mic.process(tone(300,.025)).speaking,true);
 assert.equal(mic.process(ambient).speaking,false);
});
test('quiet voices survive a quiet-room calibration; rumble and short clicks do not trigger speech',()=>{
 const mic=new MicrophoneActivity(48000);for(let i=0;i<3;i++)mic.process(new Float32Array(4800));
 let result;for(let i=0;i<3;i++)result=mic.process(tone(220,.0012));assert.equal(result.speaking,true);
 const quiet=new MicrophoneActivity(48000);for(let i=0;i<3;i++)quiet.process(new Float32Array(4800));
 const click=new Float32Array(4800);click[0]=.2;assert.equal(quiet.process(click).speaking,false);
 const filter=new MicrophoneActivity(48000);for(let i=0;i<3;i++)filter.process(tone(30,.01));
 const rumble=filter.process(tone(30,.01));assert.equal(rumble.speaking,false);assert.ok(rumble.rms<.003,'filter must attenuate low-frequency rumble');
});
test('pause bounds are forgiving and stay in the requested three-to-ten-second range',()=>{
 assert.equal(recordingPauseMs(),3000);assert.equal(recordingPauseMs(3000),3000);assert.equal(recordingPauseMs(900),3000);assert.equal(recordingPauseMs(5000),5000);assert.equal(recordingPauseMs(10000),10000);assert.equal(recordingPauseMs(20000),10000);assert.equal(recordingPauseMs(NaN),3000);
});

test('resuming a quiet short sound resets an existing pause before confirmation catches up',()=>{
 const mic=new MicrophoneActivity(48000);for(let i=0;i<3;i++)mic.process(new Float32Array(4800));
 assert.equal(mic.process(tone(300,.025)).speaking,true);
 mic.process(new Float32Array(4800));
 const resumed=mic.process(tone(220,.002).slice(0,2000));
 assert.equal(resumed.speaking,false);assert.equal(resumed.continuing,true);
});
