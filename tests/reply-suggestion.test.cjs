const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
test('reply help rejects a repeated question and accepts a learner answer',()=>{
 const {isUsefulReplySuggestion}=require('../apps/web/app/ui/reply-suggestion.ts');
 assert.equal(isUsefulReplySuggestion({korean:'어떤 음식을 좋아하세요?',english:'What food do you like?',feedback:'Try this.'},'어떤 음식을 좋아하세요?'),false);
 assert.equal(isUsefulReplySuggestion({korean:'어떤 음식을 좋아하세요',english:'What food do you like?',feedback:'Try this.'},'어떤 음식을 좋아하세요?'),false);
 assert.equal(isUsefulReplySuggestion({korean:'저는 김밥을 좋아해요.',english:'I like gimbap.',feedback:'Edit the example.'},'어떤 음식을 좋아하세요?'),true);
 for(const bad of [null,{}, {korean:'hello',english:'Hello',feedback:'Try this.'},{korean:'김밥',english:3,feedback:'Try this.'}])assert.equal(isUsefulReplySuggestion(bad,'질문'),false);
});
