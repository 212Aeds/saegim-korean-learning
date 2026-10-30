const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true,esModuleInterop:true}}).outputText,p);
const {firebaseGoogleIdentity,FirebaseIdentityVerifier}=require('../apps/api/src/firebase-identity.ts');
const {resolveFirebaseAccount}=require('../apps/api/src/firebase-accounts.ts');
const now=1800000000,project='synthetic-project';
const claims={uid:'google-uid',sub:'google-uid',aud:project,iss:`https://securetoken.google.com/${project}`,email:'test@example.org',email_verified:true,name:'Test',auth_time:now-10,firebase:{sign_in_provider:'google.com'}};

test('only recently authenticated verified Google identities in this project are accepted',()=>{
 assert.deepEqual(firebaseGoogleIdentity(claims,project,now),{uid:'google-uid',projectId:project,email:'test@example.org',name:'Test'});
 for(const patch of [{email_verified:false},{aud:'another-project'},{iss:'https://example.invalid'},{uid:''},{sub:'another-user'},{auth_time:now-301},{auth_time:now+90},{firebase:{sign_in_provider:'password'}},{email:'invalid'}]) {
  assert.throws(()=>firebaseGoogleIdentity({...claims,...patch},project,now));
 }
});

function database({bound=false,existing=false}={}) {
 const calls=[];const account={id:'original-account',email:'test@example.org',display_name:'Existing learner',password_hash:'synthetic-hash',learning_profile:{level:'basic',reasons:['family']}};
 const query=async(sql,args)=>{calls.push({sql,args});
  if(sql.includes('JOIN learner_accounts'))return {rows:bound?[account]:[]};
  if(sql.includes('FROM learner_accounts'))return {rows:existing?[account]:[]};
  if(sql.includes('INSERT INTO learner_accounts'))return {rows:[{...account,id:'new-account',display_name:args[1]}]};
  if(sql.includes('INSERT INTO learner_firebase_identities'))return {rows:[]};
  throw Error('Unexpected SQL');
 };
 return {calls,query,transaction:work=>work({query})};
}
const identity={uid:'google-uid',projectId:project,email:'test@example.org',name:'Test'};
const passwordTools={hashPassword:async()=> 'new-synthetic-hash',verifyPassword:async(password,hash)=>password==='correct-password'&&hash==='synthetic-hash'};

test('an email match alone cannot take over or overwrite an existing account',async()=>{
 for(const password of [undefined,'wrong-password']){
  const db=database({existing:true});
  await assert.rejects(resolveFirebaseAccount(db,identity,password,passwordTools));
  assert.ok(!db.calls.some(c=>/^\s*(INSERT|UPDATE|DELETE)\b/.test(c.sql)));
 }
});

test('explicit password confirmation links the original account without touching progress',async()=>{
 const db=database({existing:true});const account=await resolveFirebaseAccount(db,identity,'correct-password',passwordTools);
 assert.equal(account.id,'original-account');
 const writes=db.calls.filter(c=>/^\s*(INSERT|UPDATE|DELETE)\b/.test(c.sql));
 assert.equal(writes.length,1);assert.match(writes[0].sql,/INSERT INTO learner_firebase_identities/);
 assert.deepEqual(writes[0].args,[project,'google-uid','original-account']);
 assert.ok(!db.calls.some(c=>c.sql.includes('learner_progress')));
});

test('a bound subject keeps its account and a new identity creates a distinct account',async()=>{
 const bound=database({bound:true});assert.equal((await resolveFirebaseAccount(bound,{...identity,email:'changed@example.org'},undefined,passwordTools)).id,'original-account');
 assert.equal(bound.calls.length,1);
 const fresh=database();assert.equal((await resolveFirebaseAccount(fresh,identity,undefined,passwordTools)).id,'new-account');
 assert.equal(fresh.calls.filter(c=>/INSERT/.test(c.sql)).length,2);
 assert.ok(fresh.calls.every(c=>!c.sql.includes('test@example.org')),'identity input must be parameterized');
});

test('the verifier fails closed when disabled, checks revoked tokens, and never exposes SDK errors',async()=>{
 const oldEnabled=process.env.FIREBASE_AUTH_ENABLED,oldProject=process.env.FIREBASE_PROJECT_ID;
 try{
  const verifier=new FirebaseIdentityVerifier();let calls=0;
  verifier.client=async()=>({verifyIdToken:async(token,revoked)=>{calls++;assert.equal(token,'synthetic-token');assert.equal(revoked,true);return {...claims,auth_time:Date.now()/1000-5};}});
  process.env.FIREBASE_AUTH_ENABLED='false';process.env.FIREBASE_PROJECT_ID=project;
  await assert.rejects(verifier.verify('synthetic-token'),error=>error.getStatus()===503);assert.equal(calls,0);
  process.env.FIREBASE_AUTH_ENABLED='true';assert.equal((await verifier.verify('synthetic-token')).uid,'google-uid');
  verifier.client=async()=>({verifyIdToken:async()=>{throw Error('private SDK configuration');}});
  await assert.rejects(verifier.verify('bad-token'),error=>error.getStatus()===401&&!error.message.includes('private'));
 }finally{
  if(oldEnabled===undefined)delete process.env.FIREBASE_AUTH_ENABLED;else process.env.FIREBASE_AUTH_ENABLED=oldEnabled;
  if(oldProject===undefined)delete process.env.FIREBASE_PROJECT_ID;else process.env.FIREBASE_PROJECT_ID=oldProject;
 }
});

test('provider deletion is idempotent when its user is absent and fails safely otherwise',async()=>{
 const old=process.env.FIREBASE_PROJECT_ID;process.env.FIREBASE_PROJECT_ID=project;
 try{
  const verifier=new FirebaseIdentityVerifier();
  verifier.client=async()=>({deleteUser:async()=>{throw {code:'auth/user-not-found'};}});
  await verifier.deleteIdentity(project,'synthetic-uid');
  verifier.client=async()=>({deleteUser:async()=>{throw Error('private API response');}});
  await assert.rejects(verifier.deleteIdentity(project,'synthetic-uid'),error=>error.getStatus()===503&&!error.message.includes('private'));
 }finally{if(old===undefined)delete process.env.FIREBASE_PROJECT_ID;else process.env.FIREBASE_PROJECT_ID=old;}
});

test('account deletion rolls back local data if provider cleanup fails',async()=>{
 const {AuthController}=require('../apps/api/src/auth.controller.ts');
 const {HttpException}=require('@nestjs/common');let deleted=false,rolledBack=false,cookieCleared=false;
 const db={transaction:async work=>{try{return await work({query:async sql=>{if(sql.includes('to_regclass'))return {rows:[{available:true}]};if(sql.startsWith('SELECT'))return {rows:[{project_id:project,firebase_uid:'synthetic-uid'}]};if(sql.startsWith('DELETE')){deleted=true;return {rows:[]};}throw Error('unexpected SQL');}});}catch(e){deleted=false;rolledBack=true;throw e;}}};
 const provider={deleteIdentity:async()=>{assert.equal(deleted,true);throw new HttpException({message:'Provider cleanup unavailable'},503);}};
 const controller=new AuthController(db,provider);controller.requireAccount=async()=>({id:'original-account'});
 await assert.rejects(controller.deleteMyAccount({headers:{}},{setHeader:()=>{cookieCleared=true;}}),error=>error.getStatus()===503);
 assert.equal(rolledBack,true);assert.equal(deleted,false);assert.equal(cookieCleared,false);
});

test('Firebase exchange refuses unverified input before any account access',async()=>{
 const {AuthController}=require('../apps/api/src/auth.controller.ts');let databaseCalls=0;
 const controller=new AuthController({query:async()=>{databaseCalls++;throw Error('must not query');}}, {verify:async()=>{throw Error('invalid proof');}});
 await assert.rejects(controller.firebaseLogin({idToken:'synthetic-token',accountId:'victim'}, {ip:'127.0.0.1'},{}),error=>error.getStatus()===400);
 await assert.rejects(controller.firebaseLogin({idToken:'synthetic-token'}, {ip:'127.0.0.1'},{}));
 assert.equal(databaseCalls,0);
});

test('a verified Firebase exchange returns only the bound public account and its progress',async()=>{
 const {AuthController}=require('../apps/api/src/auth.controller.ts');const db=database({bound:true});
 const query=db.query;db.query=async(sql,args)=>sql.startsWith('DELETE FROM auth_rate_limits')?{rows:[]}:query(sql,args);
 const controller=new AuthController(db,{verify:async()=>identity});let session;
 controller.guardRateLimit=async()=>{};controller.createSession=async id=>{session=id;};controller.readProgress=async id=>{assert.equal(id,'original-account');return {completed:3};};
 const result=await controller.firebaseLogin({idToken:'synthetic-token'},{ip:'127.0.0.1'},{});
 assert.equal(result.id,'original-account');assert.equal(session,'original-account');assert.deepEqual(result.learningProgress,{completed:3});
 assert.equal(result.password_hash,undefined);assert.equal(result.idToken,undefined);
});

test('existing account deletion still works before the optional identity schema is installed',async()=>{
 const {AuthController}=require('../apps/api/src/auth.controller.ts');let deleted=false,cleared=false;
 const db={transaction:work=>work({query:async(sql,args)=>{if(sql.includes('to_regclass'))return {rows:[{available:false}]};assert.match(sql,/^DELETE FROM learner_accounts/);assert.deepEqual(args,['original-account']);deleted=true;return {rows:[]};}})};
 const controller=new AuthController(db,{deleteIdentity:async()=>assert.fail('no provider call for an old account')});controller.requireAccount=async()=>({id:'original-account'});
 await controller.deleteMyAccount({headers:{}},{setHeader:()=>{cleared=true;}});assert.equal(deleted,true);assert.equal(cleared,true);
});
