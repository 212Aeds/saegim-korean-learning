const {test} = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');

function fixture(failures = []) {
 let pool; const warnings = [], delays = [];
 class FakePool extends EventEmitter {
  calls = 0;
  failNext = false;
  constructor() { super(); pool = this; }
  async query() { this.calls++; if(failures.length) throw failures.shift(); if(this.failNext) { this.failNext=false; throw Object.assign(new Error('private SQL and credentials must not be logged'),{code:'ECONNRESET'}); } return {rows:[{ok:true}]}; }
  async end() {}
 }
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/api/src/database.service.ts','utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true},
 }).outputText, {exports,setTimeout(callback,delay){delays.push(delay);callback();},process:{env:{DATABASE_URL:'synthetic fixture only'}},require(id) {
  if(id==='pg')return {Pool:FakePool};
  if(id==='@nestjs/common')return {Injectable:()=>target=>target,Logger:class{warn(message){warnings.push(message);}}};
  throw Error('Unexpected module '+id);
 }});
 return {service:new exports.DatabaseService(),get pool(){return pool;},warnings,delays};
}

test('startup recovers from the observed connection timeout with bounded backoff',async()=>{
 const f=fixture([new Error('Connection terminated due to connection timeout')]);
 await f.service.onModuleInit();
 assert.equal(f.pool.calls,2);assert.deepEqual(f.delays,[1000]);
 assert.ok(!f.warnings.join(' ').includes('Connection terminated'));
});
test('startup stops after three transient failures and rejects permanent errors immediately',async()=>{
 const failure=Object.assign(new Error('private host'),{code:'ECONNRESET'});
 const f=fixture([failure,failure,failure]);
 await assert.rejects(f.service.onModuleInit(),{code:'ECONNRESET'});
 assert.equal(f.pool.calls,3);assert.deepEqual(f.delays,[1000,2000]);
 const permanent=fixture([Object.assign(new Error('private password'),{code:'28P01'})]);
 await assert.rejects(permanent.service.onModuleInit(),{code:'28P01'});
 assert.equal(permanent.pool.calls,1);assert.deepEqual(permanent.delays,[]);
 assert.ok(!f.warnings.join(' ').includes('private'));
});

test('a failed idle database connection is contained and later queries can still run', async () => {
 const f=fixture();
 assert.doesNotThrow(()=>f.pool.emit('error',Object.assign(new Error('private connection details'),{code:'ECONNRESET'})));
 assert.equal((await f.service.query('synthetic query')).rows[0].ok,true);
 assert.equal(f.pool.calls,1);
 assert.ok(f.warnings.length>0);
 assert.ok(!f.warnings.join(' ').includes('private connection details'));
});

test('query failures remain failures and are never automatically replayed',async()=>{
 const f=fixture(); f.pool.failNext=true;
 await assert.rejects(f.service.query('private SQL',['private input']),{code:'ECONNRESET'});
 assert.equal(f.pool.calls,1);
 assert.equal((await f.service.query('next explicit request')).rows[0].ok,true);
 assert.equal(f.pool.calls,2);
 assert.ok(f.warnings.some(message=>message.includes('ECONNRESET')));
 assert.ok(!f.warnings.join(' ').includes('private'));
});

test('unexpected error fields cannot leak into database diagnostics',()=>{
 const f=fixture();
 f.pool.emit('error',{code:'private credential',message:'private learner data',connectionString:'private URL'});
 assert.equal(f.warnings.length,1);
 assert.match(f.warnings[0],/idle-connection failed \(unknown\)/);
 assert.ok(!f.warnings.join(' ').includes('private'));
});
