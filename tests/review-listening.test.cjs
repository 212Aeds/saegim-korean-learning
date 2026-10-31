const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function fixture({reject=false,audio=true}={}){
 let cursor=0,effectCursor=0;const states=[],effects=[],calls=[];const FlipCard=()=>null;
 const react={useState(value){const i=cursor++;if(!(i in states))states[i]=typeof value==='function'?value():value;return [states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useRef(value){const i=cursor++;return states[i]??(states[i]={current:value});},useEffect(run,deps){const i=effectCursor++,old=effects[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j]))){old?.cleanup?.();effects[i]={deps,cleanup:run()};}}};
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/review-modal.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require(id){
  if(id==='react')return react;if(id==='react/jsx-runtime')return require(id);
  if(id==='./review-session')return {reviewSession:items=>items.slice()};
  if(id==='./use-dialog-focus')return {useDialogFocus:()=>{}};
  if(id==='./speech')return {prefetchLocalKorean:async()=>{},stopKoreanPlayback:()=>{},playElevenLabsKorean:async(...args)=>{calls.push(args);if(reject)throw Error('Synthetic audio failure');return {played:true};}};
  if(id==='./recorded-audio')return {flashcardSpeechText:front=>audio?front:undefined};
  if(id==='./flip-card')return {FlipCard};
  return new Proxy({},{get:()=>()=>null});
 }});
 const ratings=[],props={items:[{id:'synthetic-review',front:'거실',question:'WHAT DOES 거실 MEAN?',answer:'living room',note:'Synthetic review fixture'}],preferences:{speechVoice:'jessica',speechPace:1},onRate:(...v)=>ratings.push(v),onClose:()=>{},onPreferencesChange:()=>{}};
 const render=()=>{cursor=0;effectCursor=0;return exports.ReviewModal(props);};
 function nodes(n){return !n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(nodes)];}
 const text=n=>[n?.props?.children].flat(Infinity).map(x=>typeof x==='string'?x:typeof x==='object'?text(x):'').join('');
 const button=(tree,label)=>nodes(tree).find(n=>n.type==='button'&&text(n).includes(label));
 return {render,nodes,button,ratings,calls,flip:tree=>nodes(tree).find(n=>n.type===FlipCard)};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('listen-first review hides the target until reveal and keeps ratings explicit',()=>{
 const f=fixture();let tree=f.render();assert.ok(JSON.stringify(f.flip(tree).props.front).includes('거실'));
 const toggle=f.nodes(tree).find(n=>n.type==='input'&&n.props.type==='checkbox');assert.ok(toggle,'optional listen-first control');assert.equal(toggle.props.checked,false);
 toggle.props.onChange({target:{checked:true}});tree=f.render();assert.ok(!JSON.stringify(f.flip(tree).props.front).includes('거실'));assert.equal(f.ratings.length,0);
 f.button(tree,'Reveal card').props.onClick();tree=f.render();assert.ok(JSON.stringify(f.flip(tree).props.back).includes('거실'));assert.ok(JSON.stringify(f.flip(tree).props.back).includes('living room'));assert.equal(f.ratings.length,0);
 f.button(tree,'Remembered').props.onClick();assert.deepEqual(f.ratings,[['synthetic-review',true]]);
});
test('rejected review audio releases the playing state and offers a retry',async()=>{
 const f=fixture({reject:true});let tree=f.render();f.button(tree,'Listen to Korean').props.onClick();await settle();tree=f.render();assert.ok(f.button(tree,'Listen to Korean'));assert.ok(!f.button(tree,'Listen to Korean').props.disabled);assert.ok(f.nodes(tree).some(n=>n.props?.role==='status'));assert.equal(f.calls[0][1],'jessica');assert.equal(f.calls[0][2],1);assert.equal(f.ratings.length,0);
});
test('cards without supported audio remain readable without a misleading listening toggle',()=>{
 const f=fixture({audio:false}),tree=f.render();assert.ok(!f.button(tree,'Listen to Korean'));assert.ok(!f.nodes(tree).some(n=>n.type==='input'&&n.props.type==='checkbox'));assert.ok(JSON.stringify(f.flip(tree).props.front).includes('거실'));
});
