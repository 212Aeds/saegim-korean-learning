const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {dialogFocusableElements}=require('../apps/web/app/ui/use-dialog-focus.ts');
test('dialog focus list includes a summary but skips collapsed, inert, hidden and negative-tabindex controls',()=>{
 const old=global.window;global.window={getComputedStyle:el=>({visibility:el.visibility??'visible'})};
 const control=(id,options={})=>({id,tabIndex:0,closest:()=>options.inert?{}:null,getClientRects:()=>options.collapsed?[]:[{}],...options});
 const close=control('close'),summary=control('summary'),last=control('last');const controls=[close,control('collapsed',{collapsed:true}),summary,control('inert',{inert:true}),control('hidden',{visibility:'hidden'}),control('programmatic',{tabIndex:-1}),last];
 try{assert.deepEqual(dialogFocusableElements({querySelectorAll:selector=>{assert.match(selector,/summary/);return controls;}}).map(c=>c.id),['close','summary','last']);}finally{global.window=old;}
});
