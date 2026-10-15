const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {practiceSession,practiceMistakes}=require('../apps/web/app/practice-bank.ts');
const cards=['집','물','옷'].flatMap((word,group)=>Array.from({length:4},(_,i)=>({mode:'words',reference:word,readingSample:false,question:{id:`${group}-${i}`,type:'text',korean:word,prompt:'Recall the meaning',answer:`meaning-${group}`,accepted:[],placeholder:'Meaning',tip:'Practice'}})));
test('rounds space repeated concepts and retain distinct questions without mutating the pool',()=>{
 for(let attempt=0;attempt<40;attempt++){
   const round=practiceSession([...cards,cards[0]],20);
   assert.equal(round.length,cards.length);assert.equal(new Set(round.map(c=>c.question.id)).size,cards.length);
   for(let i=1;i<round.length;i++)assert.notEqual(round[i].reference,round[i-1].reference);
 }
 assert.equal(cards[0].question.id,'0-0');
 const single=practiceSession(cards.filter(c=>c.reference==='집'),20);assert.equal(single.length,4);
});
test('mistake review includes only missed questions actually in the round, once each',()=>{
 assert.deepEqual(practiceMistakes(cards,['0-0','0-0','2-1','unknown']).map(c=>c.question.id),['0-0','2-1']);
 assert.deepEqual(practiceMistakes(cards,[]),[]);
});
