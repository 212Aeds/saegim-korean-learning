const {test}=require('node:test'),assert=require('node:assert/strict');
const {checkHostedApi}=require('../scripts/hosted-api-preflight.cjs');
const safe={NODE_ENV:'production',DATABASE_URL:'postgresql://user:example@database.example.com/saegim?sslmode=require',WEB_ORIGINS:'https://learn.example.com',PAID_FEATURES_ENABLED:'false',PROVIDER_MONTHLY_SPEND_CAP_CENTS:'0',TUTOR_PROVIDER:'disabled',OPENROUTER_AUDIO_ENABLED:'false'};
test('hosted API refuses insecure database transport, unsafe origins and accidental paid usage',()=>{
 assert.equal(checkHostedApi(safe),true);
 for(const update of [{DATABASE_URL:''},{DATABASE_URL:safe.DATABASE_URL.replace('?sslmode=require','')},{WEB_ORIGINS:'*'},{WEB_ORIGINS:'http://localhost:3016'},{WEB_ORIGINS:'https://learn.example.com/path'},{PAID_FEATURES_ENABLED:'true'},{TUTOR_PROVIDER:'local'},{PROVIDER_MONTHLY_SPEND_CAP_CENTS:'500'},{OPENROUTER_AUDIO_ENABLED:'true'}]) assert.throws(()=>checkHostedApi({...safe,...update}));
});
