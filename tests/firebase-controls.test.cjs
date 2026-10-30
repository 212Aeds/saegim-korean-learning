const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');

function fixture({blocked=false}={}) {
 let cursor=0,effectCursor=0; const states=[],effects=[],calls=[];
 class LinkRequired extends Error{}
 const react={useRef(value){const i=cursor++;return states[i]??(states[i]={current:value});},useState(value){const i=cursor++;if(!(i in states))states[i]=value;return [states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useEffect(run){const i=effectCursor++;if(!effects[i])effects[i]={cleanup:run()};}};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/firebase-google-sign-in.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require(id){
  if(id==='react')return react;if(id==='react/jsx-runtime')return require(id);
  if(id.endsWith('.css'))return {default:{}};
  if(id==='./firebase-google')return {FirebaseLinkRequiredError:LinkRequired,firebasePopupMessage:()=> 'Popup blocked',prepareFirebaseGoogle:async()=>({start(){calls.push('popup');return blocked?Promise.reject({code:'auth/popup-blocked'}):Promise.resolve('synthetic-token');}}),exchangeFirebaseAccount:async(api,token,password)=>{calls.push(['exchange',token,password]);if(!password)throw new LinkRequired('Confirm your password');return {id:'original-account'};}};
  throw Error('Unexpected import '+id);
 }});
 let busy=false,linking=false;
 const props={apiUrl:'/api',busy:false,onBusy:v=>busy=v,onLinking:v=>linking=v,onAuthenticated:async account=>calls.push(['authenticated',account.id])};
 function render(){cursor=0;effectCursor=0;return exports.FirebaseGoogleSignIn({...props,busy});}
 function nodes(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
 const find=(tree,type,label)=>nodes(tree).find(n=>n.type===type&&(!label||nodes(n).some(child=>child.props?.children===label)));
 return {render,find,calls,get busy(){return busy;},get linking(){return linking;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('the Google control requires explicit password confirmation and keeps the original account',async()=>{
 const f=fixture();f.render();await settle();let tree=f.render();
 f.find(tree,'button','Continue with Google').props.onClick();await settle();tree=f.render();
 assert.equal(f.linking,true);assert.ok(!f.calls.some(c=>Array.isArray(c)&&c[0]==='authenticated'));
 f.find(tree,'input').props.onChange({target:{value:'synthetic-password'}});tree=f.render();
 f.find(tree,'form').props.onSubmit({preventDefault(){}});await settle();f.render();
 assert.ok(f.calls.some(c=>Array.isArray(c)&&c[0]==='authenticated'&&c[1]==='original-account'));
 assert.equal(f.busy,false);
});

test('cancelling a connection does not authenticate; a blocked popup releases busy state',async()=>{
 const f=fixture();f.render();await settle();let tree=f.render();f.find(tree,'button','Continue with Google').props.onClick();await settle();tree=f.render();
 f.find(tree,'button','Cancel connection').props.onClick();f.render();assert.equal(f.linking,false);
 assert.ok(!f.calls.some(c=>Array.isArray(c)&&c[0]==='authenticated'));
 const blocked=fixture({blocked:true});blocked.render();await settle();tree=blocked.render();blocked.find(tree,'button','Continue with Google').props.onClick();await settle();tree=blocked.render();
 assert.equal(blocked.busy,false);assert.equal(blocked.find(tree,'p','Popup blocked').props.role,'alert');
 assert.ok(!blocked.calls.some(c=>Array.isArray(c)&&c[0]==='exchange'));
});
