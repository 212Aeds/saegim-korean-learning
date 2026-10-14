const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {publicGuides}=require('../apps/web/app/public-guides.ts');const {recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');
test('public guides have unique URLs, complete teaching sections and referenced examples',()=>{
 assert.equal(publicGuides.length,3);assert.equal(new Set(publicGuides.map(g=>g.slug)).size,3);
 for(const guide of publicGuides){assert.match(guide.slug,/^[a-z]+(?:-[a-z]+)*$/);assert.ok(guide.title&&guide.description&&guide.sections.length>=3&&guide.samples.length>=3);assert.equal(new URL(guide.source.url).protocol,'https:');assert.ok(new URL(guide.source.url).hostname.endsWith('korean.go.kr'));for(const section of guide.sections)assert.ok(section.title&&section.body);}
});
test('all public guide examples have recorded audio in both voices',()=>{
 for(const guide of publicGuides)for(const sample of guide.samples)for(const voice of ['chris','jessica'])assert.ok(recordedAudioUrl(sample.korean,voice),`${guide.slug}: ${sample.korean} / ${voice}`);
});
test('guide recall checks use distinct answers supported by their examples',()=>{
 for(const guide of publicGuides){assert.equal(new Set(guide.check.choices).size,guide.check.choices.length);assert.equal(guide.check.choices.filter(c=>c===guide.check.answer).length,1);assert.ok(guide.samples.some(s=>s.korean===guide.check.answer));assert.ok(guide.check.explanation.includes(guide.check.answer));}
});

test('search setup accepts only public HTTPS origins and lists real guide routes',()=>{
 const {publicOrigin,discoveryFiles}=require('../scripts/configure-public-site.cjs');
 for(const bad of ['http://saegim.example.org','https://localhost','https://127.0.0.1','https://192.168.1.5','https://user:password@saegim.example.org','https://saegim.example.org/private','https://saegim.example.org/?key=secret'])assert.throws(()=>publicOrigin(bad));
 const {sitemap,robots}=discoveryFiles('https://saegim.example.org',publicGuides.map(g=>g.slug));
 for(const guide of publicGuides)assert.ok(sitemap.includes(`/learn/${guide.slug}/`));
 assert.equal((sitemap.match(/<loc>/g)||[]).length,7);assert.ok(!sitemap.includes('localhost'));assert.match(robots,/Sitemap: https:\/\/saegim.example.org\/sitemap.xml/);
});
