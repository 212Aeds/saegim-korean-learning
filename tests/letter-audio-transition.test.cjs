const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');

test('continuing from a letter introduction releases its audio and ignores its late result',async()=>{
 let cursor=0,effectCursor=0,audible=false,resolvePlayback;
 const states=[],refs=[],effects=[];
 const question={id:'sample',type:'text',korean:'ㅓ',answer:'eo',accepted:[],prompt:'Read the vowel',tip:'eo'};
 const react={useState(initial){const index=cursor++;if(!(index in states))states[index]=initial==='briefing'?'practice':typeof initial==='function'?initial():initial;return [states[index],value=>states[index]=typeof value==='function'?value(states[index]):value];},useRef(value){const index=cursor++;return refs[index]??(refs[index]={current:value});},useEffect(run,deps){const index=effectCursor++,before=effects[index];if(!before||deps.some((value,i)=>!Object.is(value,before.deps[i]))){before?.cleanup?.();effects[index]={deps,cleanup:run()};}}};
 const exports={};
 const requireStub=id=>{
  if(id==='react')return react;
  if(id==='react/jsx-runtime')return require(id);
  if(id==='./use-dialog-focus')return {useDialogFocus(){}};
  if(id==='../curriculum')return {normalizeAnswer:value=>value,shuffle:items=>items};
  if(id==='../more-lessons')return {additionalVocabulary:[],hangulLetters:[],hangulSyllableExamples:[]};
  if(id==='../word-bank')return {wordBank:[]};
  if(id==='./lesson-answer')return {lessonTextAssessment:()=>({correct:false,near:false})};
  if(id==='./lesson-questions')return {prepareQuestions:()=>({practice:[question],quiz:[question]}),lessonIntroduction:()=>({example:'ㅓ'}),lessonTopicIntroduction:()=>null,lessonLetterIntroduction:()=>({id:'letter-ㅓ',letter:'ㅓ',title:'Meet ㅓ',explanation:'Romanized as eo',audioText:'어',romanization:'eo'})};
  if(id==='./speech')return {prefetchLocalKorean:async()=>{},playElevenLabsKorean:()=>{audible=true;return new Promise(resolve=>resolvePlayback=resolve);},stopKoreanPlayback(){audible=false;}};
  return new Proxy({},{get:(_,key)=>String(key)});
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/lesson-modal.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:requireStub});
 const props={lesson:{id:'test',title:'Test',category:'Hangul'},preferences:{speechVoice:'jessica',speechPace:1,hintLevel:'standard'},onClose(){},onPreferencesChange(){},onComplete(){}};
 function render(){cursor=0;effectCursor=0;return exports.LessonModal(props);}
 function button(node,text){if(!node||typeof node!=='object')return;const children=[node.props?.children].flat(Infinity);if(node.type==='button'&&children.some(child=>typeof child==='string'&&child.includes(text)))return node;for(const child of children){const found=button(child,text);if(found)return found;}}
 let tree=render();button(tree,'Listen ·').props.onClick();tree=render();assert.equal(audible,true);
 button(tree,'Practice this letter').props.onClick();tree=render();assert.equal(audible,false,'the introduction must not keep speaking over its exercise');
 resolvePlayback({played:false});await new Promise(resolve=>setImmediate(resolve));tree=render();
 assert.equal(button(tree,'Stop audio'),undefined,'the exercise must not retain the old busy state');
 assert.equal(JSON.stringify(tree).includes('matching voice could not start'),false,'late cancellation must not show an audio error on the new exercise');
});
