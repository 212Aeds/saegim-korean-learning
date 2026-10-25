const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {summarize,availability,demoEvents}=require('../apps/web/app/analytics-preview/model.ts');
test('only fixed measurements count; invalid and arbitrary content are rejected',()=>{
 const report=summarize([{feature:'tutor',outcome:'success',milliseconds:900},{feature:'email@example.com',outcome:'success',milliseconds:2},{feature:'speak',outcome:'success',milliseconds:-1}]);
 assert.equal(report.total,1);assert.equal(report.rows.find(r=>r.feature==='tutor').success,1);
});
test('cancellation is separate from failure and latency excludes failed or cancelled work',()=>{
 const report=summarize([{feature:'tutor',outcome:'success',milliseconds:1000},{feature:'tutor',outcome:'failure',milliseconds:9000},{feature:'tutor',outcome:'cancelled',milliseconds:30000}]);
 const row=report.rows.find(r=>r.feature==='tutor');assert.equal(row.failure,1);assert.equal(row.cancelled,1);assert.equal(row.p95,1000);assert.equal(row.successRate,50);
});
test('empty data does not imply zero latency or perfect success',()=>{const r=summarize([]).rows[0];assert.equal(r.p95,null);assert.equal(r.successRate,null);});
test('availability distinguishes failure, slow recovery and healthy checks',()=>{assert.equal(availability([false,false]),'down');assert.equal(availability([false,true]),'recovered');assert.equal(availability([true]),'up');assert.equal(availability([]),'unknown');});
test('fixtures use only valid measurements and fixed features',()=>{assert.equal(summarize(demoEvents).total,demoEvents.length);});
