const fs=require('node:fs'),{test}=require('node:test'),assert=require('node:assert/strict');
const page=fs.readFileSync('apps/web/app/page.tsx','utf8');
test('public content becomes ready before any account request and session reads are bounded',()=>{
 const start=page.indexOf('async function restoreProgress');
 const auth=page.indexOf('const accountResponse = await fetch',start);
 assert.ok(page.indexOf('setReady(true); // Public content',start)<auth);
 assert.match(page,/signal: AbortSignal.timeout\(65000\)/);
 assert.match(page,/if\(version!==restoreVersion.current\)return/);
});
test('guest storage is distinct and guest progress never enters the debounced account writer',()=>{
 assert.match(page,/freePublishing \|\| guest \? deviceProgressKey : "sori-progress"/);
 assert.match(page,/if \(apiUrl && account && !guest\)/);
 assert.match(page,/if \(!ready \|\| !account\) return/);
});
test('guest onboarding and settings save locally; guest recognition uses the device practice path',()=>{
 assert.match(fs.readFileSync('apps/web/app/ui/learning-onboarding.tsx','utf8'),/freePublishing \|\| account.id === "device-only"/);
 assert.match(fs.readFileSync('apps/web/app/ui/account-modal.tsx','utf8'),/freePublishing \|\| account\?.id === "device-only"/);
 assert.match(fs.readFileSync('apps/web/app/ui/openrouter-listening-practice.tsx','utf8'),/if\(guest\)return <DeviceListeningPractice/);
 assert.match(page,/tab === "tutor" && !guest && tutorEnabled/);
});
test('existing account progress takes precedence; only an empty account inherits the guest session',()=>{
 assert.match(page,/if \(remote\) setProgress\(normalizeProgress\(remote\)\);/);
 assert.match(page,/const fresh = \{\.\.\.\(guest \? progress : initialProgress\)/);
 assert.match(page,/account=\{guest && guestAuthOpen \? null/);
});
