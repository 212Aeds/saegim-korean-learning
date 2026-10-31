const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('the landing hero has one primary entry and keeps the optional sample separate',()=>{
 const exports={},empty=()=>null;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/landing-page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require(id){
  if(id==='react')return {useState:v=>[v,()=>{}],useEffect:()=>{}};
  if(id==='react/jsx-runtime')return require(id);
  if(id==='../curriculum')return {lessons:[]};
  if(id==='./speech')return {stopKoreanPlayback:()=>{},playKorean:async()=>({played:true})};
  return new Proxy({},{get:()=>empty});
 }});
 function nodes(n){return !n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(nodes)];}
 let starts=0;
 const tree=exports.LandingPage({onStartGuest:()=>starts++,onCreateAccount:()=>{},onSignIn:()=>{}});
 const hero=nodes(tree).find(n=>n.type==='section'&&n.props.id==='home');
 const primary=nodes(hero).filter(n=>(n.type==='button'||n.type==='a')&&n.props.className?.includes('button-dark'));
 assert.equal(primary.length,1);primary[0].props.onClick();assert.equal(starts,1);
 assert.ok(nodes(hero).some(n=>n.type==='a'&&n.props.href==='#try-korean'));
 assert.ok(nodes(tree).some(n=>n.type==='button'&&n.props.children==='Sign in'));
});
