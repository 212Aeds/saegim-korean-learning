const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function fixture(play){
 const source=fs.readFileSync('apps/web/app/ui/lesson-modal.tsx','utf8');
 const start=source.indexOf('  async function listen(');
 const end=source.indexOf('\n  function advance()',start);
 assert.ok(start>=0&&end>start);
 const state={busy:false,notice:''};
 const playbackAttempt={current:0};
 const compiled=ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const listen=vm.runInNewContext(compiled+'\nlisten',{playbackAttempt,preferences:{speechVoice:'chris',speechPace:1},playElevenLabsKorean:play,setAudioBusy:value=>state.busy=value,setAudioNotice:value=>state.notice=value});
 return {listen,state,playbackAttempt};
}
test('lesson audio rejection releases Listen and allows a successful retry',async()=>{
 let calls=0;
 const f=fixture(async(text,voice,pace)=>{
  assert.equal(text,'가');assert.equal(voice,'chris');assert.equal(pace,1);
  if(++calls===1)throw Error('Synthetic failure');
  return {played:true};
 });
 await f.listen('가');assert.equal(f.state.busy,false);assert.match(f.state.notice,/Try Listen again/);
 await f.listen('가');assert.equal(f.state.busy,false);assert.equal(f.state.notice,'');assert.equal(calls,2);
});
test('an obsolete lesson playback failure cannot overwrite the next step',async()=>{
 let reject;
 const f=fixture(()=>new Promise((resolve,fail)=>reject=fail));
 const pending=f.listen('가');
 f.playbackAttempt.current++;f.state.busy=true;f.state.notice='New step';
 reject(Error('Late synthetic failure'));await pending;
 assert.equal(f.state.busy,true);assert.equal(f.state.notice,'New step');
});
