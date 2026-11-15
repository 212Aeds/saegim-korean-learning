const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),{test}=require('node:test'),assert=require('node:assert/strict');
function fixture(){
 const slots=[],effects=[],created=[],revoked=[];let cursor=0,resolve,signal,options,captures=0;
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];},useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial});},useEffect(effect){const i=cursor++;if(!(i in slots)){slots[i]=true;effects.push(effect());}}};
 class Audio{play(){return Promise.resolve();}pause(){}}
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/pronunciation-comparison.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText,{exports,AbortController,Blob,Audio,DOMException,URL:{createObjectURL:()=>{const url='blob:fixture-'+created.length;created.push(url);return url;},revokeObjectURL:url=>revoked.push(url)},document:{addEventListener(){},removeEventListener(){}},require:id=>id==='react'?hooks:id==='react/jsx-runtime'?require('react/jsx-runtime'):id==='./conversation-recording'?{recordConversationTurn:(s,level,o)=>{captures++;signal=s;options=o;return new Promise(r=>{resolve=r;o.onReady(()=>r(new ArrayBuffer(48)));});}}:{playElevenLabsKorean:async()=>({played:true}),stopKoreanPlayback(){}}});
 function render(){cursor=0;return exports.PronunciationComparison({korean:'가',voice:'chris',pace:1});}
 function buttons(node,result=[]){if(!node)return result;if(Array.isArray(node)){node.forEach(n=>buttons(n,result));return result;}if(node.type==='button')result.push(node);buttons(node.props?.children,result);return result;}
 function button(label){const match=buttons(render()).find(b=>JSON.stringify(b.props.children).includes(label));assert.ok(match,label);return match.props;}
 return {button,created,revoked,get captures(){return captures;},get signal(){return signal;},resolve:()=>resolve(new ArrayBuffer(48)),unmount:()=>effects.forEach(fn=>fn?.())};
}
test('comparison captures only after a click, keeps one clip, and revokes it on discard',async()=>{
 const f=fixture();assert.equal(f.captures,0);f.button('Record my voice').onClick();assert.equal(f.captures,1);f.button('Stop recording').onClick();await new Promise(r=>setImmediate(r));assert.equal(f.created.length,1);assert.equal(f.button('Listen to my recording').disabled,false);
 f.button('Discard recording').onClick();assert.deepEqual(f.revoked,f.created);f.unmount();
});
test('unmount cancels pending capture and prevents a late clip from appearing',async()=>{
 const f=fixture();f.button('Record my voice').onClick();f.unmount();assert.equal(f.signal.aborted,true);f.resolve();await new Promise(r=>setImmediate(r));assert.equal(f.created.length,0);
});
