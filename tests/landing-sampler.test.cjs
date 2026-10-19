const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {landingSamples}=require('../apps/web/app/landing-samples.ts');
const {lessons}=require('../apps/web/app/curriculum.ts');
test('public samples use distinct existing lessons and valid choice answers',()=>{assert.equal(landingSamples.length,3);assert.equal(new Set(landingSamples.map(s=>s.lessonId)).size,3);for(const sample of landingSamples){const lesson=lessons.find(l=>l.id===sample.lessonId);assert.ok(lesson);assert.ok(lesson.questions.includes(sample.question));assert.equal(sample.question.type,'choice');assert.ok(sample.question.choices.includes(sample.question.answer));assert.ok(sample.question.tip);}});
