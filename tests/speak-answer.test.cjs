const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {matchesPracticeAnswer}=require('../apps/web/app/ui/speech-check.ts');
test('practice accepts the supplied romanization and Korean without accepting mixed scripts or numbers',()=>{
 for(const answer of ['나무','namu','NAMU','na-mu',' namu! ']) assert.equal(matchesPracticeAnswer('나무',answer,'namu'),true,answer);
 for(const answer of ['namu123','namu가','namu💰','nami','']) assert.equal(matchesPracticeAnswer('나무',answer,'namu'),false,answer);
 assert.equal(matchesPracticeAnswer('나무','namu'),false);
 assert.equal(matchesPracticeAnswer('ㄱ','g'),true);
});
