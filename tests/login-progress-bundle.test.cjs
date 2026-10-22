const fs=require('fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,esModuleInterop:true}}).outputText,p);
const {AuthController}=require('../apps/api/src/auth.controller.ts');
test('successful login includes only that verified account progress without a second session lookup',async()=>{
 const password='synthetic-password-123',salt=Buffer.alloc(16,7),key=crypto.scryptSync(password,salt,64),calls=[];
 const database={query:async(sql,args)=>{calls.push({sql,args});if(sql.includes('FROM learner_accounts'))return {rows:[{id:'synthetic-id',email:'test@example.org',display_name:'Test',learning_profile:{level:'new',reasons:['family']},password_hash:`scrypt$${salt.toString('hex')}$${key.toString('hex')}`}]};if(sql.includes('FROM learner_progress'))return {rowCount:1,rows:[{completed_lessons:2,completed_lesson_ids:['first'],words_learned:5,activity_dates:[],last_activity:null}]};return {rows:[]};}};
 const controller=new AuthController(database);controller.guardRateLimit=async()=>{};let session;controller.createSession=async id=>{session=id;};controller.recordRateLimit=async()=>{};
 const reply=await controller.login({email:'test@example.org',password},{ip:'127.0.0.1'},{});
 assert.equal(session,'synthetic-id');assert.equal(reply.learningProgress.completed,2);assert.deepEqual(reply.learningProgress.completedLessonIds,['first']);assert.equal(reply.password_hash,undefined);assert.equal(calls.filter(x=>x.sql.includes('FROM learner_progress')).length,1);assert.deepEqual(calls.find(x=>x.sql.includes('FROM learner_progress')).args,['synthetic-id']);assert.ok(!calls.some(x=>x.sql.includes('learner_sessions')));
 calls.length=0;session=undefined;await assert.rejects(controller.login({email:'test@example.org',password:'wrong-password-123'},{ip:'127.0.0.1'},{}));assert.equal(session,undefined);assert.ok(!calls.some(x=>x.sql.includes('FROM learner_progress')));
});
test('account dialog is prepared before click and bundled progress is stripped from account state',()=>{
 const page=fs.readFileSync('apps/web/app/page.tsx','utf8');assert.match(page,/void loadAccountModal\(\)\.catch/);assert.match(page,/learningProgress !== undefined \? null : await fetch/);assert.match(page,/const \{learningProgress, \.\.\.accountDetails\}=user/);assert.match(page,/setAccount\(accountDetails\)/);
});

test('session restoration bundles progress only after identifying the signed-in account',async()=>{
 const controller=new AuthController({query:async()=>{throw Error('Unexpected database access');}});let reads=0;
 controller.getAccount=async()=>null;controller.readProgress=async id=>{reads++;assert.equal(id,'synthetic-id');return {completed:2};};
 assert.equal(await controller.currentAccount({}),null);assert.equal(reads,0);
 controller.getAccount=async()=>({account:{id:'synthetic-id',email:'test@example.org',displayName:'Test'}});
 const restored=await controller.currentAccount({});assert.deepEqual(restored.learningProgress,{completed:2});assert.equal(reads,1);
});
