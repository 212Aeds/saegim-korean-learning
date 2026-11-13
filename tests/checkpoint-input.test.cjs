const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function render(answer){
 const item={id:'sample',lessonTitle:'Synthetic lesson',question:{id:'q',type:'text',korean:'fixture',prompt:'Write the answer',answer,accepted:[],tip:'Synthetic tip'}};
 const states=[[[item],()=>{}],[0,()=>{}],['',()=>{}],[false,()=>{}],[[],()=>{}]];let cursor=0;const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/weekly-checkpoint.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require(id){
 if(id==='react')return {useMemo:()=>[],useState:()=>states[cursor++]};
 if(id==='react/jsx-runtime')return require(id);
 if(id==='../weekly-checkpoint')return {checkpointItems:()=>[]};
 if(id==='../curriculum')return {isCorrectTextAnswer:()=>false,normalizeAnswer:v=>v.toLowerCase()};
 if(id==='./word-reference')return {WordReference:'WordReference'};
 if(id==='./korean-keyboard')return {KoreanInput:'KoreanInput'};
 throw Error(id);
 }});
 const nodes=[];function walk(n){if(!n||typeof n!=='object')return;nodes.push(n);[n.props?.children].flat(Infinity).forEach(walk);}walk(exports.WeeklyCheckpoint({completed:['sample']}));return nodes;
}
test('checkpoint Korean answers get the shared keyboard while romanized answers keep a plain input',()=>{
 assert.ok(render('가방').some(n=>n.type==='KoreanInput'));
 const roman=render('gabang');assert.ok(roman.some(n=>n.type==='input'));assert.ok(!roman.some(n=>n.type==='KoreanInput'));
});
test('checkpoint Enter does not check or advance while an IME is composing Korean',()=>{
 const form=render('가방').find(n=>n.type==='form');
 for(const [key,keyCode,isComposing,expected] of [['Enter',13,true,true],['Enter',229,false,true],['Enter',13,false,false],['a',65,false,false]]){
 let prevented=false;form.props.onKeyDown({key,keyCode,nativeEvent:{isComposing},preventDefault(){prevented=true}});assert.equal(prevented,expected);
 }
});
