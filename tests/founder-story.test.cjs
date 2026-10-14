const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test');
for(const extension of ['.ts','.tsx'])require.extensions[extension]=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,p);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{FounderStory}=require('../apps/web/app/ui/founder-story.tsx');
test('founder story presents the personal family motivation and has distinct accessible headings',()=>{
 const home=renderToStaticMarkup(React.createElement(FounderStory)),about=renderToStaticMarkup(React.createElement(FounderStory,{compact:true}));
 assert.match(home,/connect better with my family/);assert.match(home,/I kept finding apps with paywalls/);assert.match(home,/aria-labelledby="home-story-title"/);assert.match(about,/aria-labelledby="about-story-title"/);assert.ok(!about.includes('founder-story-art'));assert.ok(!home.includes('All apps'));
});
