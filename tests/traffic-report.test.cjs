const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {parseTraffic}=require('../apps/web/app/developer/traffic-report.ts');
const report={state:'ready',measuredAt:'2026-10-30T18:00:01.000Z',periodStart:'2026-10-29T18:00:00.000Z',periodEnd:'2026-10-30T18:00:00.000Z',data:{visits:5,pageViews:7,performanceSamples:5,vitalSamples:4,pageLoadAvgMs:822,pageLoadP75Ms:1133,lcpP75Ms:1148,inpP75Ms:null,clsP75:0,referrals:[],devices:[{label:'mobile',count:7}],browsers:[],countries:[]}};
test('traffic retains real zero layout shift and absent interaction samples without inventing zeros',()=>{
 const value=parseTraffic(report);assert.equal(value.data.clsP75,0);assert.equal(value.data.inpP75Ms,null);assert.equal(value.data.visits,5);assert.equal(parseTraffic({...report,state:'stale'}).state,'stale');
});
test('traffic errors are distinct from zero traffic and invalid snapshots are refused',()=>{
 assert.equal(parseTraffic({state:'unavailable',data:null}).data,null);
 for(const value of [null,{}, {...report,periodStart:'invalid'}, {...report,data:{...report.data,visits:null}},{...report,data:{...report.data,devices:Array(6).fill({label:'mobile',count:1})}},{...report,data:{...report.data,lcpP75Ms:-1}}])assert.equal(parseTraffic(value),null);
});
