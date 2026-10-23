const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');

test('Practiced · Next card plays feedback on every tap without awarding completion again',()=>{
 const source=fs.readFileSync('apps/web/app/ui/speak-deck.tsx','utf8');
 let sounds=0;const navigated=[],completed=[];
 const cards=['one','two','three'].map(id=>({id,kind:'word',korean:'가',prompt:'가',focus:'가'}));
 const exports={};
 const requireStub=id=>{
  if(id==='react')return {useState:value=>[value,()=>{}],useRef:value=>({current:value}),useEffect:()=>{}};
  if(id==='react/jsx-runtime')return require(id);
  if(id==='../speak-cards')return {speakingCardsForProfile:()=>cards};
  if(id==='./feedback-sound')return {playCorrectAnswerSound:()=>sounds++};
  return new Proxy({},{get:(_,key)=>String(key)});
 };
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:requireStub});
 function find(node){if(!node||typeof node!=='object')return;const children=node.props?.children;
  if(node.type==='button'&&Array.isArray(children)&&children.some(c=>typeof c==='string'&&c.includes('Practiced · Next card')))return node;
  for(const child of [children].flat(Infinity)){const result=find(child);if(result)return result;}
 }
 for(const card of cards){const tree=exports.SpeakDeck({completedIds:cards.map(c=>c.id),profile:{level:'basic',reasons:[]},completedLessonIds:[],currentCardId:card.id,onNavigate:id=>navigated.push(id),onComplete:(...args)=>completed.push(args),preferences:{},onPreferencesChange:()=>{}});
  const button=find(tree);assert.ok(button,'completed-card action is reachable');button.props.onClick();
 }
 assert.equal(sounds,3,'each explicit practiced tap should play the practice sound');
 assert.deepEqual(navigated,['two','three','one']);
 assert.deepEqual(completed,[],'revisiting must not award progress again');
});
