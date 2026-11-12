const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {checkpointItems}=require('../apps/web/app/weekly-checkpoint.ts');
const q=(id)=>({id,type:'text',korean:id,prompt:'Recall '+id,answer:id,accepted:[],tip:'A checked fixture',placeholder:''});
const lesson=(id,questions)=>({id,title:id,detail:'',category:'',minutes:1,words:[],questions});
test('checkpoint stays within completed authored material and preserves a small honest round',()=>{
 const a=lesson('a',[q('one'),q('two')]),b=lesson('b',[q('three'),q('four')]),unseen=lesson('unseen',[q('secret')]);
 assert.deepEqual(checkpointItems([], [a,b,unseen]),[]);
 const items=checkpointItems(['a','a','b','unknown'],[a,b,unseen]);
 assert.equal(items.length,4);assert.ok(items.every(item=>['a','b'].includes(item.lessonId)));
 assert.deepEqual(items.map(item=>item.lessonId),['b','a','b','a']);
});
test('checkpoint caps five, deduplicates identical prompts and excludes practice-only additions',()=>{
 const a=lesson('a',Array.from({length:9},(_,i)=>q('q'+i)));a.practiceOnlyQuestionIds=['q0'];
 const generated={...lesson('generated',[q('unseen')]),generatedPracticeOnly:true};
 const b=lesson('b',[{...q('q1'),id:'duplicate'}]);
 const items=checkpointItems(['a','generated','b'],[a,generated,b]);
 assert.equal(items.length,5);assert.equal(items.filter(item=>item.question.answer==='q1').length,1);
 assert.ok(items.every(item=>item.question.id!=='q0'&&item.lessonId!=='generated'));
});
