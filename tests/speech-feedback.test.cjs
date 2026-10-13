const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
for(const extension of ['.ts','.tsx']) require.extensions[extension]=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,p);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {SpeechFeedback}=require('../apps/web/app/ui/speech-feedback.tsx');
const {transcriptRomanization}=require('../apps/web/app/ui/transcript-romanization.ts');
test('match feedback places Korean, romanization, and a distinct result in reading order',()=>{
 const html=renderToStaticMarkup(React.createElement(SpeechFeedback,{transcript:'너',matches:true}));
 assert.ok(html.indexOf('>너</p>')<html.indexOf('>neo</p>'));
 assert.ok(html.indexOf('>neo</p>')<html.indexOf('>Match</strong>'));
 assert.match(html,/class="speech-result"/);assert.match(html,/Thumbs up/);
 const retry=renderToStaticMarkup(React.createElement(SpeechFeedback,{transcript:'네',matches:false}));
 assert.match(retry,/>ne<\/p>/);assert.match(retry,/>Try again<\/strong>/);assert.ok(!retry.includes('Thumbs up'));
});
test('romanization normalizes transcript spacing before sound rules',()=>{
 assert.equal(transcriptRomanization('  오늘은\n어떤\t이야기?  '),'oneureun eotteon iyagi?');
 assert.equal(transcriptRomanization('국물'),'gungmul');
 assert.equal(transcriptRomanization('같이'),'gachi');
 assert.equal(transcriptRomanization('읽어요'),'ilgeoyo');
});

test('canonical conversation WAV bypasses browser decoding and rejects other formats',async()=>{
 process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL='http://127.0.0.1:5055';
 const {isMono16kWav,transcribeOnLocalServer}=require('../apps/web/app/ui/local-speech-server.ts');
 const buffer=new ArrayBuffer(48),v=new DataView(buffer);
 for(const [offset,text] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])for(let i=0;i<4;i++)v.setUint8(offset+i,text.charCodeAt(i));
 v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint16(34,16,true);v.setUint32(40,4,true);
 assert.equal(isMono16kWav(buffer),true);assert.equal(isMono16kWav(new ArrayBuffer(4)),false);
 v.setUint16(22,2,true);assert.equal(isMono16kWav(buffer),false);v.setUint16(22,1,true);
 const oldFetch=global.fetch;global.fetch=async(url,options)=>{assert.equal(url,'http://127.0.0.1:5055/v1/speech/transcribe');assert.equal(options.body.get('audio').size,48);return {ok:true,json:async()=>({transcript:'너'})};};
 try{assert.equal(await transcribeOnLocalServer(new Blob([buffer])),'너');}finally{global.fetch=oldFetch;}
});
