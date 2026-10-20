const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const compile=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,p);
require.extensions['.ts']=compile;require.extensions['.tsx']=compile;
const {FeatureGuide}=require('../apps/web/app/ui/feature-guide.tsx'),{GuestLearningContext}=require('../apps/web/app/ui/guest-learning.tsx');
test('guide gives guests controls they actually have and preserves microphone guidance for accounts',()=>{
 const view=guest=>renderToStaticMarkup(React.createElement(GuestLearningContext.Provider,{value:guest},React.createElement(FeatureGuide,{sections:[],onNavigate(){},onSettings(){}})));
 const guest=view(true);assert.match(guest,/without an email/);assert.match(guest,/No microphone upload is needed/);assert.doesNotMatch(guest,/then tap Speak/);
 const account=view(false);assert.match(account,/then tap Speak/);assert.match(account,/3, 5, or 10 seconds/);assert.doesNotMatch(account,/No microphone upload is needed/);
});
