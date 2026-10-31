const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {createTrafficReader}=require('../apps/api/src/cloudflare-analytics.ts');
const env={CLOUDFLARE_ANALYTICS_ENABLED:'true',CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_ANALYTICS_API_TOKEN:'synthetic-secret'};
const account={total:[{count:7,sum:{visits:5}}],performance:[{count:5,avg:{pageLoadTime:822000},quantiles:{pageLoadTimeP75:1133000}}],vitals:[{count:4,quantiles:{largestContentfulPaintP75:1148000,interactionToNextPaintP75:-1,cumulativeLayoutShiftP75:0}}],referrals:[{count:2,sum:{visits:2},dimensions:{refererHost:'example.test'}}],devices:[{count:7,dimensions:{deviceType:'mobile'}}],browsers:[],countries:[]};
const response=()=>new Response(JSON.stringify({data:{viewer:{accounts:[account]}}}));
test('analytics is fixed to the Saegim site, bounded and server-authenticated; concurrent reads share cache',async()=>{
 let calls=0;const read=createTrafficReader({env,request:async(url,options)=>{calls++;assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer synthetic-secret');const query=JSON.parse(options.body).query;assert.match(query,/saegim.onrender.com/);assert.match(query,/ad8cd0087dd04c8b97b9e8ec5910e488/);assert.ok(!query.includes('refererPath'));return response();},now:()=>1793400000000});
 const [a,b]=await Promise.all([read(),read()]);assert.equal(calls,1);assert.equal(a.state,'ready');assert.equal(a.data.visits,5);assert.equal(a.data.pageViews,7);assert.equal(a.data.lcpP75Ms,1148);assert.equal(a.data.inpP75Ms,null);assert.equal(a.data.clsP75,0);assert.deepEqual(a,b);await read();assert.equal(calls,1);assert.ok(!JSON.stringify(a).includes('synthetic-secret'));
});
test('missing configuration never calls Cloudflare and upstream errors do not masquerade as zero traffic',async()=>{
 let calls=0;const disabled=createTrafficReader({env:{},request:async()=>{calls++;return response();}});assert.equal((await disabled()).state,'unconfigured');assert.equal(calls,0);
 const broken=createTrafficReader({env,request:async()=>new Response(JSON.stringify({errors:[{message:'private upstream error'}]}))});const result=await broken();assert.equal(result.state,'unavailable');assert.equal(result.data,null);assert.ok(!JSON.stringify(result).includes('private upstream error'));
});
test('failed refresh preserves a clearly stale snapshot with a retry cooldown',async()=>{
 let time=1793400000000,calls=0;const read=createTrafficReader({env,now:()=>time,request:async()=>++calls===1?response():new Response('{}',{status:429})});await read();time+=301000;const stale=await read();assert.equal(stale.state,'stale');assert.equal(stale.data.visits,5);await read();assert.equal(calls,2);
});

test('oversized and malformed upstream data stays unavailable, while an empty valid window is zero',async()=>{
 const oversized=createTrafficReader({env,request:async()=>new Response('x'.repeat(131073))});assert.equal((await oversized()).state,'unavailable');
 const missing=createTrafficReader({env,request:async()=>new Response(JSON.stringify({data:{viewer:{accounts:[]}}}))});assert.equal((await missing()).state,'unavailable');
 const empty=createTrafficReader({env,request:async()=>new Response(JSON.stringify({data:{viewer:{accounts:[{total:[],performance:[],vitals:[],referrals:[],devices:[],browsers:[],countries:[]}]}}}))});const value=await empty();assert.equal(value.state,'ready');assert.equal(value.data.visits,0);assert.equal(value.data.lcpP75Ms,null);
});
