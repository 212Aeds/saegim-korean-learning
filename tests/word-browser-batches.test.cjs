const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');

test('word browsing limits initial cards, preserves search coverage and reveals every word',()=>{
 const source=ts.createSourceFile('page.tsx',fs.readFileSync('apps/web/app/page.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const component=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='WordsView');
 assert.ok(component);
 const words=Array.from({length:137},(_,index)=>({id:String(index),korean:`단어${index}`,romanization:`word${index}`,meaning:index===136?'needle':'example',category:'Everyday',example:''}));
 let cursor=0;const state=[],heard=[],exports={};
 vm.runInNewContext(ts.transpileModule(component.getText(source)+'\nexports.WordsView=WordsView;',{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022},
 }).outputText,{exports,require,wordBank:words,additionalVocabulary:[],hangulLetters:[],wordCategories:['Everyday'],
  useState(initial){const slot=cursor++;if(!(slot in state))state[slot]=initial;return[state[slot],value=>{state[slot]=typeof value==='function'?value(state[slot]):value;}];},
  useRef:()=>({current:null}),useEffect:()=>{},WordPacks:()=>null,WordReference:()=>null,SpeakerHigh:()=>null,
 });
 const render=()=>{cursor=0;return exports.WordsView({learnedWords:[],onHear:word=>heard.push(word)});};
 function nodes(tree){if(!tree||typeof tree!=='object')return[];return[tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
 const cards=tree=>nodes(tree).filter(node=>node.type==='article'&&node.props.className==='word-card');
 const button=(tree,label)=>nodes(tree).find(node=>node.type==='button'&&[node.props.children].flat(Infinity).join('')===label);
 let tree=render();assert.equal(cards(tree).length,60,'initial browsing should not render all 137 cards');
 const seen=new Set(cards(tree).map(card=>card.key));
 button(tree,'Show more words').props.onClick();tree=render();assert.equal(cards(tree).length,120);
 cards(tree).forEach(card=>seen.add(card.key));button(tree,'Show more words').props.onClick();tree=render();
 assert.equal(cards(tree).length,137);cards(tree).forEach(card=>seen.add(card.key));assert.equal(seen.size,137);
 assert.equal(button(tree,'Show more words'),undefined,'no extra expansion once all matches are visible');
 const search=nodes(tree).find(node=>node.props?.id==='word-search-input');
 search.props.onChange({target:{value:'needle'}});tree=render();assert.equal(cards(tree).length,1,'search includes words beyond the initial batch');
 const audio=nodes(cards(tree)[0]).find(node=>node.props?.['aria-label']==='Hear 단어136');audio.props.onClick();assert.deepEqual(heard,['단어136']);
 button(tree,'Clear search').props.onClick();tree=render();assert.equal(cards(tree).length,60,'clearing filters starts a small fresh batch');
 button(tree,'Show more words').props.onClick();tree=render();
 button(tree,'Everyday').props.onClick();tree=render();assert.equal(cards(tree).length,60,'category changes reset the display batch');
 button(tree,'Words from your lessons · 0').props.onClick();tree=render();assert.equal(cards(tree).length,0);
 button(tree,'Explore all words').props.onClick();tree=render();assert.equal(cards(tree).length,60,'returning to all words resets the batch');
});
