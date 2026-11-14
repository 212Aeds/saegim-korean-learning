const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {canReportCrash,sanitizeCrash,createCrashFilter}=require('../apps/web/app/ui/crash-privacy.ts');
test('crash reporting excludes previews and respects browser privacy choices',()=>{
 for(const hints of [{hostname:'localhost'},{hostname:'saegim.onrender.com.evil.test'},{hostname:'saegim.onrender.com',pathname:'/developer/'},{hostname:'saegim.onrender.com',pathname:'/checkpoint-preview'},{hostname:'saegim.onrender.com',doNotTrack:'1'},{hostname:'saegim.onrender.com',globalPrivacyControl:true}])assert.equal(canReportCrash(hints),false);
 assert.equal(canReportCrash({hostname:'saegim.onrender.com',pathname:'/'}),true);
});
test('privacy allowlist removes synthetic learner content and keeps only app code locations',()=>{
 const privateText='synthetic-person@example.invalid private-chat private-token';
 const event={event_id:'a'.repeat(32),timestamp:100,message:privateText,user:{email:privateText},request:{url:privateText},breadcrumbs:[{message:privateText}],extra:{body:privateText},contexts:{secret:privateText},tags:{secret:privateText},exception:{values:[{type:'TypeError',value:privateText,stacktrace:{frames:[{filename:'https://saegim.onrender.com/_next/static/chunks/123-abcd.js?token=private-token',lineno:12,colno:7,function:privateText,vars:{secret:privateText}},{filename:'https://third-party.invalid/private-chat.js'}]}}]}};
 const clean=sanitizeCrash(event);const json=JSON.stringify(clean);for(const token of ['private-chat','private-token','example.invalid','breadcrumbs','contexts','request','vars'])assert.ok(!json.includes(token),token);
 assert.equal(clean.exception.values[0].type,'TypeError');assert.equal(clean.exception.values[0].stacktrace.frames[0].lineno,12);assert.equal(clean.exception.values[0].stacktrace.frames.length,1);
 assert.equal(sanitizeCrash({message:privateText}),null);
});
test('repeated errors are deduplicated and per-page reports capped',()=>{
 const filter=createCrashFilter(2);const event=n=>({exception:{values:[{type:'Error',stacktrace:{frames:[{filename:`https://saegim.onrender.com/_next/static/chunks/${n}.js`,lineno:1}]}}]}});
 assert.ok(filter(event(1)));assert.equal(filter(event(1)),null);assert.ok(filter(event(2)));assert.equal(filter(event(3)),null);
});
test('SDK starts only once with error handlers, no content collection or replay',()=>{
 const vm=require('node:vm');let options,calls=0;
 const exports={};const location={hostname:'saegim.onrender.com',pathname:'/'};
 const sdk={init:value=>{options=value;calls++;},globalHandlersIntegration:()=>({name:'GlobalHandlers'})};
 const source=fs.readFileSync('apps/web/app/ui/crash-reporting.ts','utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,location,navigator:{},URL,require:id=>id==='@sentry/browser'?sdk:require('../apps/web/app/ui/crash-privacy.ts')});
 exports.startCrashReporting();exports.startCrashReporting();assert.equal(calls,1);
 assert.equal(options.defaultIntegrations,false);assert.deepEqual(Array.from(options.integrations,x=>x.name),['GlobalHandlers']);
 assert.equal(options.tracesSampleRate,0);assert.equal(options.replaysSessionSampleRate,0);assert.equal(options.replaysOnErrorSampleRate,0);assert.equal(options.maxBreadcrumbs,0);assert.equal(options.sendClientReports,false);
 assert.equal(options.dataCollection.userInfo,false);assert.equal(options.dataCollection.httpBodies.length,0);assert.equal(options.dataCollection.genAI.inputs,false);
 location.pathname='/developer/';assert.equal(options.beforeSend({exception:{values:[]}}),null);
});
