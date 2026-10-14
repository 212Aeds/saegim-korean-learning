const fs=require('node:fs'),path=require('node:path');
function publicOrigin(value){
 let url;try{url=new URL(value);}catch{throw Error('Provide your public HTTPS website origin.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||!url.hostname.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/i.test(url.hostname)||/\.(localhost|invalid|test)$/i.test(url.hostname))throw Error('Use a public HTTPS origin without credentials, paths or query parameters.');
 return url.origin;
}
function discoveryFiles(origin,slugs){
 origin=publicOrigin(origin);
 const routes=['/','/about/','/privacy/','/learn/',...slugs.map(slug=>`/learn/${slug}/`)];
 if(slugs.some(slug=>!/^[a-z]+(?:-[a-z]+)*$/.test(slug)))throw Error('Invalid guide slug.');
 return {sitemap:'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+routes.map(route=>`  <url><loc>${origin}${route}</loc></url>`).join('\n')+'\n</urlset>\n',robots:`User-agent: *\nAllow: /\nDisallow: /v1/\nSitemap: ${origin}/sitemap.xml\n`};
}
module.exports={publicOrigin,discoveryFiles};
if(require.main===module){try{
 const ts=require('typescript');require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
 const {publicGuides}=require('../apps/web/app/public-guides.ts');
 const urlArg=process.argv.indexOf('--url'),origin=publicOrigin(urlArg>=0?process.argv[urlArg+1]:process.env.SAEGIM_PUBLIC_URL);
 const output=path.resolve(__dirname,'../apps/web/.next-public');if(!fs.existsSync(path.join(output,'index.html')))throw Error('Run npm run build:free first.');
 const files=discoveryFiles(origin,publicGuides.map(guide=>guide.slug));fs.writeFileSync(path.join(output,'sitemap.xml'),files.sitemap);fs.writeFileSync(path.join(output,'robots.txt'),files.robots);
 console.log('Prepared sitemap.xml and robots.txt. Repackage or deploy the public build. This does not publish the site or verify domain ownership.');
}catch(error){console.error(error.message);process.exitCode=1;}}
