const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
test('conversation errors distinguish daily allowance, session expiry and a temporary outage',()=>{
 const {conversationRequestError}=require('../apps/web/app/ui/conversation-request-error.ts');
 assert.match(conversationRequestError(429),/daily.*limit/i);assert.doesNotMatch(conversationRequestError(429),/shortly|busy/);
 assert.match(conversationRequestError(401),/sign in/i);assert.match(conversationRequestError(503),/try again/i);
});
test('a starter interrupts audio instead of silently refusing a click; read-aloud prepares while the tutor replies',()=>{
 const ui=fs.readFileSync('apps/web/app/ui/tutor-conversation.tsx','utf8'),send=ui.slice(ui.indexOf('async function sendMessage'),ui.indexOf('async function send(event'));
 assert.doesNotMatch(send,/if \(!text \|\| request.current \|\| calling \|\| playing\)/);
 assert.match(send,/if\(playing\)\{listeningAttempt.current\+\+;stopKoreanPlayback\(\);setPlaying\(false\);/);
 assert.ok(send.indexOf('void enableBrowserVoices()')<send.indexOf('await replyTo(text)'));
 assert.match(fs.readFileSync('apps/web/public/voices/worker.js','utf8'),/styles\[data.voice\],8,\.9,\.25/);
});
