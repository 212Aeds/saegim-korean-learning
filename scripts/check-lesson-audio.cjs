const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function auditCatalog(manifest,publicDir){
 let totalBytes=0;
 for(const [key,url] of Object.entries(manifest)){
  if(!/^(chris|jessica)\|.+$/u.test(key)||typeof url!=='string'||!/^\/audio\/lessons\/[a-f0-9]{64}\.wav$/.test(url))throw Error('Invalid audio catalog entry');
  const hash=crypto.createHash('sha256').update('supertonic3-v1|'+key).digest('hex');
  if(url!==`/audio/lessons/${hash}.wav`)throw Error('Audio catalog key does not match its file');
  const bytes=fs.readFileSync(path.join(publicDir,url));
  if(bytes.length<44||bytes.length>5*1024*1024||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('Invalid audio file');
  totalBytes+=bytes.length;
 }
 return {clips:Object.keys(manifest).length,totalBytes};
}
module.exports={auditCatalog};
if(require.main===module){try{const root=path.resolve(__dirname,'..');const result=auditCatalog(JSON.parse(fs.readFileSync(path.join(root,'apps/web/app/audio-manifest.json'),'utf8')),path.join(root,'apps/web/public'));console.log(`${result.clips} verified clips; ${(result.totalBytes/1024/1024).toFixed(1)} MiB. No model server required for these files.`);}catch(error){console.error(error.message);process.exitCode=1;}}
