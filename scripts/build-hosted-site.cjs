const {spawnSync}=require('node:child_process');
const api=process.env.NEXT_PUBLIC_API_URL;
let origin;try{origin=api==='/api' ? new URL('https://same-origin.example.com') : new URL(api);}catch{throw Error('Set NEXT_PUBLIC_API_URL to the deployed HTTPS API origin.');}
if(origin.protocol!=='https:' || (api!=='/api' && origin.origin!==api) || !origin.hostname.includes('.') || /^(localhost|127\.|10\.|192\.168\.)/.test(origin.hostname) || /\.(test|invalid|localhost)$/.test(origin.hostname))throw Error('Use an exact public HTTPS API origin.');
if(!process.env.npm_execpath)throw Error('Run npm run build:hosted');
const result=spawnSync(process.execPath,[process.env.npm_execpath,'--workspace','@sori/web','run','build'],{stdio:'inherit',env:{...process.env,SAEGIM_HOSTED_AI:'true',STATIC_PUBLISH:'true',SORI_WEB_DIST_DIR:'.next-hosted-public',NEXT_PUBLIC_PRERECORDED_AUDIO:'true',NEXT_PUBLIC_HOSTED_AI_ENABLED:'true',NEXT_PUBLIC_FREE_PUBLISHING:'false',NEXT_PUBLIC_PAID_FEATURES_ENABLED:'false',NEXT_PUBLIC_LOCAL_TUTOR_ENABLED:'false',NEXT_PUBLIC_LOCAL_SPEECH_URL:''}});
process.exitCode=result.status??1;
if(process.exitCode===0){
 const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
 const {publicOrigin,discoveryFiles}=require('./configure-public-site.cjs');
 const siteOrigin=publicOrigin(process.env.SAEGIM_PUBLIC_URL??'https://saegim.onrender.com');
 require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
 const {publicGuides}=require('../apps/web/app/public-guides.ts');
 const files=discoveryFiles(siteOrigin,publicGuides.map(guide=>guide.slug));
 const output=path.resolve(__dirname,'../apps/web/.next-hosted-public');
 fs.writeFileSync(path.join(output,'sitemap.xml'),files.sitemap);
 fs.writeFileSync(path.join(output,'robots.txt'),files.robots);
 console.log('Prepared hosted sitemap.xml and robots.txt. Search indexing is not guaranteed.');
 require('./measure-startup.cjs');
}
