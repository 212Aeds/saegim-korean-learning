const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,p);
const {freeAllowance}=require('../apps/api/src/developer-health.ts');
test('allowance reports exhaustion at request or token boundary without changing limits',()=>{
 const env={TUTOR_PROVIDER:'cloudflare',FREE_AI_PROJECT_DAILY_LIMIT:'10'};
 assert.equal(freeAllowance({requests:10,tutorRequests:3,tutorTokens:'48000'},env).state,'exhausted');
 assert.equal(freeAllowance({requests:2,tutorRequests:2,tutorTokens:'160000'},env).state,'exhausted');
 assert.equal(freeAllowance({requests:8,tutorRequests:8,tutorTokens:'128000'},env).remaining,2);
 assert.equal(freeAllowance(null,env).remaining,10);
});
test('unsupported providers and invalid counters remain unknown',()=>{
 assert.equal(freeAllowance(null,{TUTOR_PROVIDER:'local'}).state,'unknown');
 assert.equal(freeAllowance({requests:-1,tutorRequests:2,tutorTokens:'1'},{TUTOR_PROVIDER:'cloudflare'}).state,'unknown');
 assert.equal(freeAllowance({requests:2,tutorRequests:2,tutorTokens:'9007199254740992'},{TUTOR_PROVIDER:'cloudflare'}).state,'unknown');
});
const {recordProviderResult,providerResults}=require('../apps/api/src/provider-health.ts');
test('provider observation stores only the latest sanitized result, not learner content',()=>{
 recordProviderResult('tutor','limited',1250);const first=providerResults();assert.equal(first.tutor.state,'limited');assert.equal(first.tutor.durationMs,1250);
 assert.deepEqual(Object.keys(first.tutor).sort(),['at','durationMs','state']);first.tutor.state='error';assert.equal(providerResults().tutor.state,'limited');
 recordProviderResult('tutor','success',250);assert.equal(providerResults().tutor.state,'success');
});
