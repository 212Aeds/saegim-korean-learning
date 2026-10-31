const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {parseOverview,summarizeUsage}=require('../apps/web/app/developer/report.ts');
const base={measuredAt:'2026-10-30T00:05:00.000Z',usage:[{date:'2026-10-30',requests:4,tutorRequests:3},{date:'2026-10-29',requests:6,tutorRequests:2}]};
test('report totals describe reservations and UTC today, not people or successful actions',()=>{
 const report=parseOverview(base);assert.ok(report);assert.deepEqual(summarizeUsage(report),{requests:10,tutorRequests:5,activeDays:2,todayRequests:4});
 assert.deepEqual(summarizeUsage(parseOverview({...base,usage:[]})),{requests:0,tutorRequests:0,activeDays:0,todayRequests:0});
});
test('incomplete or invalid snapshots cannot crash the page or display invented zero counts',()=>{
 for(const value of [null,{}, {...base,usage:null},{...base,measuredAt:'not a date'}, {...base,usage:[{date:'2026-10-30',requests:null,tutorRequests:1}]},{...base,usage:[{date:'2026-10-30',requests:2,tutorRequests:3}]},{...base,usage:[{date:'2026-10-31',requests:2,tutorRequests:1}]},{...base,usage:[base.usage[0],base.usage[0]]}])assert.equal(parseOverview(value),null);
});
test('optional provider and allowance diagnostics are sanitized independently of valid counts',()=>{
 const report=parseOverview({...base,allowance:{state:'available',limit:200,used:null,remaining:200,accountLimit:100},providerResults:{tutor:{state:'success',durationMs:-1,at:base.measuredAt}},aiConfigured:'yes'});
 assert.ok(report);assert.equal(report.allowance,null);assert.equal(report.providerResults.tutor,null);assert.equal(report.aiConfigured,null);
});
