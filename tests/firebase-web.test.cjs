const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {exchangeFirebaseAccount,FirebaseLinkRequiredError,firebasePopupMessage}=require('../apps/web/app/ui/firebase-google.ts');

test('Google exchange keeps cookies and sends only proof and optional password in a single bounded POST',async()=>{
 const original=global.fetch;let calls=0;
 try{global.fetch=async(url,options)=>{calls++;assert.equal(url,'/api/v1/auth/firebase');assert.equal(options.method,'POST');assert.equal(options.credentials,'include');assert.ok(options.signal);assert.deepEqual(JSON.parse(options.body),{idToken:'synthetic-token',currentPassword:'synthetic-password'});return {ok:true,status:200,json:async()=>({id:'account',email:'test@example.org',displayName:'Test',learningProgress:{completed:3}})};};
  const user=await exchangeFirebaseAccount('/api','synthetic-token','synthetic-password');assert.equal(user.learningProgress.completed,3);assert.equal(calls,1);
 }finally{global.fetch=original;}
});

test('link confirmation is explicit; offline and malformed replies are recoverable',async()=>{
 const original=global.fetch;
 try{
  global.fetch=async()=>({status:409,ok:false,json:async()=>({code:'ACCOUNT_LINK_REQUIRED'})});
  await assert.rejects(exchangeFirebaseAccount('/api','synthetic-token'),FirebaseLinkRequiredError);
  global.fetch=async()=>{throw Error('private connection details');};
  await assert.rejects(exchangeFirebaseAccount('/api','synthetic-token'),/could not be reached/);
  global.fetch=async()=>({ok:true,status:200,json:async()=>({id:'incomplete'})});
  await assert.rejects(exchangeFirebaseAccount('/api','synthetic-token'),/incomplete/);
 }finally{global.fetch=original;}
 assert.match(firebasePopupMessage({code:'auth/popup-blocked'}),/blocked/);
 assert.match(firebasePopupMessage({code:'auth/popup-closed-by-user'}),/cancelled/);
 assert.ok(!firebasePopupMessage({message:'private key'}).includes('private'));
});
