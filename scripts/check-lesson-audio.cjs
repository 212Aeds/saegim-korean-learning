const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function auditWav(bytes){
 if(bytes.length<44||bytes.length>5*1024*1024||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.readUInt32LE(4)!==bytes.length-8)throw Error('Invalid or truncated audio file');
 let offset=12,format=false,data=false;
 while(offset<bytes.length){
  if(offset+8>bytes.length)throw Error('Truncated WAV chunk header');
  const id=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),end=offset+8+size;
  if(end>bytes.length)throw Error('Truncated WAV chunk');
  if(id==='fmt '){
   if(size<16||bytes.readUInt16LE(offset+8)!==1||bytes.readUInt16LE(offset+10)!==1||bytes.readUInt16LE(offset+22)!==16||bytes.readUInt16LE(offset+20)!==2)throw Error('Expected mono PCM16 audio');
   const rate=bytes.readUInt32LE(offset+12);if(!rate||bytes.readUInt32LE(offset+16)!==rate*2)throw Error('Invalid WAV sample rate');
   format=true;
  }
  if(id==='data'){if(!size||size%2)throw Error('Empty or incomplete WAV samples');data=true;}
  offset=end+(size%2);
 }
 if(offset!==bytes.length||!format||!data)throw Error('Missing or incomplete WAV chunks');
}
function auditCatalog(manifest,publicDir){
 let totalBytes=0;
 for(const [key,url] of Object.entries(manifest)){
  if(!/^(chris|jessica)\|.+$/u.test(key)||typeof url!=='string'||!/^\/audio\/lessons\/[a-f0-9]{64}\.wav$/.test(url))throw Error('Invalid audio catalog entry');
  const hashes=['supertonic3-v1|','supertonic3-v2|'].map(version=>crypto.createHash('sha256').update(version+key).digest('hex'));
  if(!hashes.some(hash=>url===`/audio/lessons/${hash}.wav`))throw Error('Audio catalog key does not match its file');
  const bytes=fs.readFileSync(path.join(publicDir,url));
  auditWav(bytes);
  totalBytes+=bytes.length;
 }
 return {clips:Object.keys(manifest).length,totalBytes};
}
module.exports={auditCatalog,auditWav};
function auditBlocks(publicDir){
 let clips=0,totalBytes=0;
 for(let onset=0;onset<19;onset++)for(let vowel=0;vowel<21;vowel++){
  const pair=[];
  for(const voice of ['chris','jessica']){
   const bytes=fs.readFileSync(path.join(publicDir,'audio/blocks',`${voice}-${0xac00+onset*588+vowel*28}.wav`));
   auditWav(bytes);
   pair.push(bytes);clips++;totalBytes+=bytes.length;
  }
  if(pair[0].equals(pair[1]))throw Error('Block voices must use distinct recordings');
 }
 return {clips,totalBytes};
}
module.exports.auditBlocks=auditBlocks;
if(require.main===module){try{const root=path.resolve(__dirname,'..'),publicDir=path.join(root,'apps/web/public');const result=auditCatalog(JSON.parse(fs.readFileSync(path.join(root,'apps/web/app/audio-manifest.json'),'utf8')),publicDir),blocks=auditBlocks(publicDir);console.log(`${result.clips+blocks.clips} verified clips, including ${blocks.clips} block clips; ${((result.totalBytes+blocks.totalBytes)/1024/1024).toFixed(1)} MiB. No model server required for these files.`);}catch(error){console.error(error.message);process.exitCode=1;}}
