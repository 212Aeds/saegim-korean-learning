const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,experimentalDecorators:true}}).outputText,p);
const {conversationRequestSchema}=require('../apps/api/src/tutor/tutor.schema.ts'),{conversationPolicy}=require('../apps/api/src/tutor/conversation-policy.ts');
test('reply suggestions use a distinct validated mode tied to the latest question',()=>{
 const input={mode:'reply-help',messages:[{role:'user',content:'I want to order coffee.'},{role:'assistant',content:'무엇을 마시고 싶어요?'},{role:'user',content:'Help me answer your latest question.'}],level:'basic',scenario:'cafe',consent:true};
 assert.equal(conversationRequestSchema.safeParse(input).success,true);assert.equal(conversationRequestSchema.safeParse({...input,mode:'anything'}).success,false);
 assert.match(conversationPolicy(input),/LAST partner question/);assert.match(conversationPolicy(input),/not another partner turn or a new question/);assert.doesNotMatch(conversationPolicy({...input,level:"new"}),/including one very simple question/);
 const normal=conversationPolicy({...input,mode:'conversation'});assert.match(normal,/latest learner message/);assert.match(normal,/answer it before following up/);
 const ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8');assert.match(ui,/mode:"reply-help"/);assert.match(ui,/latestPartner\?replyIdea\?\.korean:situation.phrase/);
 assert.doesNotMatch(ui,/The same Chris and Jessica voices as your lessons/);
 const speak=fs.readFileSync('apps/web/app/ui/server-speech-practice.tsx','utf8');assert.match(speak,/manualStop:true/);assert.doesNotMatch(speak,/Pause before checking/);
});

test('hosted conversation forwards the actual latest transcript and previous exchange without a canned replacement',async()=>{
 const old={...process.env},original=global.fetch;const sent=[];
 Object.assign(process.env,{CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'synthetic-token',CLOUDFLARE_FREE_PLAN_CONFIRMED:'true',TUTOR_PROVIDER:'cloudflare',PAID_FEATURES_ENABLED:'false',PROVIDER_TERMS_REVIEWED:'true'});
 global.fetch=async(url,options)=>{const payload=JSON.parse(options.body);sent.push(payload);return new Response(JSON.stringify({success:true,result:{response:JSON.stringify({explanation:sent.length===1?'커피를 좋아하시는군요. 어떤 커피를 좋아하세요?':'차도 좋아요. 따뜻한 차를 좋아하세요?',hint:'Synthetic contextual translation.',nextExercise:'Synthetic learning tip.'})}}));};
 try{const {OpenRouterTutorProvider}=require('../apps/api/src/tutor/tutor-provider.ts');const provider=new OpenRouterTutorProvider();const first={level:'basic',scenario:'cafe',consent:true,messages:[{role:'user',content:'커피를 좋아해요.'}]};const a=await provider.answer({question:first.messages[0].content,lessonContext:'',conversation:first});const next={...first,messages:[...first.messages,{role:'assistant',content:a.explanation},{role:'user',content:'오늘은 차를 마시고 싶어요.'}]};const b=await provider.answer({question:next.messages.at(-1).content,lessonContext:'',conversation:next});
 assert.notEqual(a.explanation,b.explanation);assert.equal(sent[1].messages.at(-1).content,'오늘은 차를 마시고 싶어요.');assert.equal(sent[1].messages.at(-2).content,a.explanation);assert.match(sent[1].messages[0].content,/latest learner message/);
 }finally{global.fetch=original;process.env=old;}
});
