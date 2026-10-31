const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {installCloudflareAnalytics}=require('../apps/web/app/ui/web-analytics.ts');
function fixture(){const scripts=[];return {scripts,getElementById:id=>scripts.find(s=>s.id===id),createElement:()=>({setAttribute(name,value){this[name]=value;}}),body:{appendChild(script){scripts.push(script);}}};}
test('analytics installs once on the public hostname with no automatic lesson navigation or custom data',()=>{
 const doc=fixture();installCloudflareAnalytics(doc,{hostname:'saegim.onrender.com'});installCloudflareAnalytics(doc,{hostname:'saegim.onrender.com'});
 assert.equal(doc.scripts.length,1);const script=doc.scripts[0];assert.equal(script.src,'https://static.cloudflareinsights.com/beacon.min.js');assert.equal(script.type,'module');assert.equal(script.async,true);
 const options=JSON.parse(script['data-cf-beacon']);assert.equal(options.spa,false);assert.match(options.token,/^[a-f0-9]{32}$/);assert.deepEqual(Object.keys(options).sort(),['spa','token']);
});
test('analytics respects privacy signals and excludes local, preview and lookalike hosts',()=>{
 for(const hints of [{hostname:'localhost'},{hostname:'127.0.0.1'},{hostname:'preview.onrender.com'},{hostname:'saegim.onrender.com.attacker.test'},{hostname:'saegim.onrender.com',doNotTrack:'1'},{hostname:'saegim.onrender.com',doNotTrack:'yes'},{hostname:'saegim.onrender.com',globalPrivacyControl:true}]){const doc=fixture();installCloudflareAnalytics(doc,hints);assert.equal(doc.scripts.length,0,JSON.stringify(hints));}
});

test('internal developer and experiment pages do not inflate learner traffic',()=>{
 for(const pathname of ['/developer','/developer/','/developer/settings','/analytics-preview','/feature-preview/']){
  const doc=fixture();installCloudflareAnalytics(doc,{hostname:'saegim.onrender.com',pathname});assert.equal(doc.scripts.length,0,pathname);
 }
 for(const pathname of ['/','/guides/hangul/']){const doc=fixture();installCloudflareAnalytics(doc,{hostname:'saegim.onrender.com',pathname});assert.equal(doc.scripts.length,1);}
});
