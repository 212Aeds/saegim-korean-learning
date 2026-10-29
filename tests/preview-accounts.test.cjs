const fs = require('node:fs');
const ts = require('typescript');
const {test} = require('node:test');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (m,p) => m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'), {
  compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,p);
const {previewAccountsMissing} = require('../apps/web/app/ui/preview-accounts.ts');

test('a static loopback preview detects its missing account route without sending credentials', async () => {
 const original = global.fetch; let calls=0;
 try {
  global.fetch = async (url,options) => {
   calls++; assert.equal(url,'/api/v1/health'); assert.equal(options.credentials,'omit');
   assert.equal(options.cache,'no-store'); assert.ok(!options.body && !options.headers);
   return {status:404,headers:new Headers({'content-type':'text/html'})};
  };
  for (const hostname of ['127.0.0.1','localhost','[::1]']) assert.equal(await previewAccountsMissing('/api',hostname),true);
  assert.equal(calls,3);
 } finally { global.fetch=original; }
});

test('production and explicit API configurations never probe or disable sign-in', async () => {
 const original=global.fetch;
 try {
  global.fetch=()=>{throw Error('must not fetch')};
  for(const [api,host] of [['/api','saegim.onrender.com'],['http://localhost:4004','localhost'],[undefined,'localhost'],['/api','localhost.example.org']]) {
   assert.equal(await previewAccountsMissing(api,host),false);
  }
 } finally {global.fetch=original;}
});

test('a functioning preview API stays usable and network uncertainty does not disable it', async () => {
 const original=global.fetch;
 try {
  global.fetch=async()=>({status:200,headers:new Headers({'content-type':'application/json'})});
  assert.equal(await previewAccountsMissing('/api','localhost'),false);
  global.fetch=async()=>({status:200,headers:new Headers({'content-type':'text/html'})});
  assert.equal(await previewAccountsMissing('/api','localhost'),true);
  global.fetch=async()=>{throw Error('temporarily offline')};
  assert.equal(await previewAccountsMissing('/api','localhost'),false);
 } finally {global.fetch=original;}
});
