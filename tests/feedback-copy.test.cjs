const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {copyFeedbackReport}=require('../apps/web/app/ui/copy-feedback-report.ts');
test('copy report writes only the prepared text and reports success',async()=>{let copied;assert.equal(await copyFeedbackReport('My explicit report',{writeText:async text=>{copied=text;}}),'copied');assert.equal(copied,'My explicit report');});
test('copy report handles blocked or unavailable clipboard without losing the report',async()=>{assert.equal(await copyFeedbackReport('report',undefined),'unavailable');assert.equal(await copyFeedbackReport('report',{writeText:async()=>{throw new Error('Permission denied');}}),'unavailable');});
