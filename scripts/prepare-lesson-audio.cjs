// Generate reusable audio locally. Never calls a paid service.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const root=path.resolve(__dirname,'..');
const {hangulLetters}=require('../apps/web/app/more-lessons.ts');
const {naturalSpeechText}=require('../apps/web/app/ui/hangul-answers.ts');
const {lessons}=require('../apps/web/app/curriculum.ts');
const manifestPath=path.join(root,'apps/web/app/audio-manifest.json');
const output=path.join(root,'apps/web/public/audio/lessons');fs.mkdirSync(output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const args=process.argv.slice(2),selected=[];
for(let i=0;i<args.length;i++){
 if(args[i]==='--lesson'&&args[i+1]){const id=args[++i],lesson=lessons.find(l=>l.id===id);if(!lesson)throw Error(`Unknown lesson: ${id}`);selected.push(lesson);}
 else if(!['--all','--catalog'].includes(args[i]))throw Error('Use --all or --lesson <lesson-id>.');
}
if(selected.length&&args.includes('--all'))throw Error('Choose --all or selected lessons.');
const source=args.includes('--all')?lessons:selected;
const words=args.includes('--catalog') ? Object.keys(manifest).filter(key=>key.startsWith('chris|')).map(key=>key.slice(6)) : source.length ? source.flatMap(l=>[...l.words,...l.questions.map(q=>q.korean),...(l.briefing?[l.briefing.example]:[])]) : [...hangulLetters.map(l=>l.korean),'안녕하세요','감사합니다','다시 말해 주세요.','이거 얼마예요?'];
const texts=[...new Set(words.map(t=>naturalSpeechText(t).normalize('NFC').trim().replace(/\s+/gu,' ')).filter(t=>t&&t.length<=300))];
async function main(){
 let made=0,skipped=0;
 for(const text of texts)for(const voice of ['chris','jessica']){
  const key=`${voice}|${text}`,hash=crypto.createHash('sha256').update('supertonic3-v2|'+key).digest('hex'),name=`${hash}.wav`,file=path.join(output,name);
  if(manifest[key]===`/audio/lessons/${name}`&&fs.existsSync(file)){skipped++;continue;}
  const response=await fetch('http://127.0.0.1:5055/v1/speech/synthesize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice,quality:"recording"}),signal:AbortSignal.timeout(180000)});
  if(!response.ok||!response.headers.get('content-type')?.startsWith('audio/'))throw Error(`Audio preparation failed (${response.status})`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<44||bytes.length>5*1024*1024||bytes.toString('ascii',0,4)!=='RIFF')throw Error('Invalid WAV from local server');
  fs.writeFileSync(file,bytes);manifest[key]=`/audio/lessons/${name}`;
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  made++;if(made%10===0)console.log(`${made} clips prepared`);
 }
 console.log(`Prepared ${made}; reused ${skipped}; ${Object.keys(manifest).length} clips in catalog.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
