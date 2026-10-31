const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {recordProviderResult,providerSummary}=require('../apps/api/src/provider-health.ts');
test('provider summaries count fixed outcomes with bounded successful-latency buckets only',()=>{
 const empty=providerSummary();assert.equal(empty.tutor.total,0);assert.equal(empty.tutor.p95UpperMs,null);
 recordProviderResult('tutor','success',800);recordProviderResult('tutor','success',1800);recordProviderResult('tutor','limited',60000);recordProviderResult('tutor','error',5000);
 const snapshot=providerSummary();assert.equal(snapshot.tutor.total,4);assert.equal(snapshot.tutor.success,2);assert.equal(snapshot.tutor.limited,1);assert.equal(snapshot.tutor.error,1);assert.equal(snapshot.tutor.p50UpperMs,1000);assert.equal(snapshot.tutor.p95UpperMs,2000);assert.equal(snapshot.whisper.total,0);
 assert.deepEqual(Object.keys(snapshot.tutor).sort(),['error','limited','p50UpperMs','p95UpperMs','success','total']);
 snapshot.tutor.total=100;assert.equal(providerSummary().tutor.total,4);
});
test('invalid durations do not poison latency estimates or expose payload fields',()=>{
 recordProviderResult('whisper','success',NaN);const row=providerSummary().whisper;assert.equal(row.total,1);assert.equal(row.p50UpperMs,null);
});
