const fs=require('fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {guidedConversationStep,guidedChoiceMatches}=require('../apps/web/app/ui/guided-conversation.ts');const {recordedAudioUrl}=require('../apps/web/app/ui/recorded-audio.ts');
test('all fifteen guided starters finish with bounded choices and matching recorded partner voices',()=>{
 for(const level of ['new','hangul','basic','intermediate','advanced'])for(let starter=0;starter<3;starter++)for(let step=0;step<3;step++){
  const result=guidedConversationStep(level,starter,step);assert.match(result.reply.korean,/[가-힣]/u);assert.ok(result.reply.english);assert.ok(result.reply.feedback);assert.equal(result.choices.length>0,step<2);
  for(const voice of ['chris','jessica'])assert.ok(recordedAudioUrl(result.reply.korean,voice),`${voice}: ${result.reply.korean}`);
  for(const choice of result.choices){assert.ok(guidedChoiceMatches(choice.korean,choice.english,choice.korean));assert.ok(guidedChoiceMatches(choice.korean,choice.english,choice.english));assert.equal(guidedChoiceMatches(choice.korean,choice.english,'unrelated request'),false);}
 }
});
test('guided practice is explicit and optional while primary starters use actual AI',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8');const start=ui.slice(ui.indexOf('async function beginGuided'),ui.indexOf('async function sendMessage'));
 assert.doesNotMatch(start,/fetch\(|replyTo\(/);assert.match(ui,/onClick=\{\(\) => void sendMessage\(topic\)\}/);assert.match(ui,/Prefer guided practice without AI/);const reply=ui.slice(ui.indexOf("async function replyTo"),ui.indexOf("async function toggleReadAloud"));assert.doesNotMatch(reply,/guidedConversationStep|setGuided/);assert.match(ui,/Guided practice · no AI requests/);assert.match(ui,/if\(browserVoices&&speakReplies&&!guided\)/);
});
