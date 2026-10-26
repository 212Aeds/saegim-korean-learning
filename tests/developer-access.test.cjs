const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,esModuleInterop:true}}).outputText,p);
const {DeveloperController}=require('../apps/api/src/developer.controller.ts');
test('developer data requires the authenticated owner, never an email supplied by the client',async()=>{
 let calls=0;const controller=new DeveloperController({query:async(sql,args)=>{calls++;if(calls===1){assert.equal(args[0],'owner-session-id');return {rows:[{email:'aeden.gray2@gmail.com'}]};}return {rows:[{date:'2026-10-26',requests:3,tutorRequests:2}]};}});
 assert.equal((await controller.overview({soriAccountId:'owner-session-id'})).usage.length,1);assert.equal(calls,2);
});
test('missing sessions and other accounts cannot read aggregates',async()=>{
 let calls=0;const controller=new DeveloperController({query:async()=>{calls++;return {rows:[{email:'synthetic-other@example.test'}]};}});
 await assert.rejects(()=>controller.overview({}),e=>e.getStatus()===403);assert.equal(calls,0);
 await assert.rejects(()=>controller.overview({soriAccountId:'other',email:'aeden.gray2@gmail.com'}),e=>e.getStatus()===403);assert.equal(calls,1);
});
test('deleted owner record denies access without querying aggregate data',async()=>{let calls=0;const c=new DeveloperController({query:async()=>{calls++;return {rows:[]};}});await assert.rejects(()=>c.overview({soriAccountId:'deleted'}));assert.equal(calls,1);});
test('HTTP route retains session authentication and private no-store caching',()=>{
 const {GUARDS_METADATA,HEADERS_METADATA}=require('@nestjs/common/constants');
 const {SessionAuthGuard}=require('../apps/api/src/session-auth.guard.ts');
 assert.ok(Reflect.getMetadata(GUARDS_METADATA,DeveloperController).includes(SessionAuthGuard));
 assert.ok(Reflect.getMetadata(HEADERS_METADATA,DeveloperController.prototype.overview).some(h=>h.name==='Cache-Control'&&h.value==='private, no-store'));
});
