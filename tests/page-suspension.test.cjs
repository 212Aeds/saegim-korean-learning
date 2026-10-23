const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
test('page suspension pauses active conversation work without restarting on return and cleans up listeners',()=>{
 const {pauseOnPageLeave}=require('../apps/web/app/ui/page-suspension.ts');
 const doc=Object.assign(new EventTarget(),{hidden:false}),win=new EventTarget();let pauses=0;const cleanup=pauseOnPageLeave(()=>pauses++,doc,win);
 doc.dispatchEvent(new Event('visibilitychange'));assert.equal(pauses,0);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(pauses,1);doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(pauses,1);
 win.dispatchEvent(new Event('pagehide'));assert.equal(pauses,2);cleanup();win.dispatchEvent(new Event('pagehide'));doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(pauses,2);
});
