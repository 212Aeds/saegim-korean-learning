const {test}=require('node:test'),assert=require('node:assert/strict');
const {checkHostedApi}=require('../scripts/hosted-api-preflight.cjs');
const safe={NODE_ENV:'production',DATABASE_URL:'postgresql://user:example@database.example.com/saegim?sslmode=require',WEB_ORIGINS:'https://learn.example.com',PAID_FEATURES_ENABLED:'false',PROVIDER_MONTHLY_SPEND_CAP_CENTS:'0',TUTOR_PROVIDER:'disabled',OPENROUTER_AUDIO_ENABLED:'false'};
test('hosted API refuses insecure database transport, unsafe origins and accidental paid usage',()=>{
 assert.equal(checkHostedApi(safe),true);
 for(const update of [{DATABASE_URL:''},{DATABASE_URL:safe.DATABASE_URL.replace('?sslmode=require','')},{WEB_ORIGINS:'*'},{WEB_ORIGINS:'http://localhost:3016'},{WEB_ORIGINS:'https://learn.example.com/path'},{PAID_FEATURES_ENABLED:'true'},{TUTOR_PROVIDER:'local'},{PROVIDER_MONTHLY_SPEND_CAP_CENTS:'500'},{OPENROUTER_AUDIO_ENABLED:'true'}]) assert.throws(()=>checkHostedApi({...safe,...update}));
});

test('hosted API permits reviewed Cloudflare free configuration but rejects unconfirmed activation',()=>{
 const cloud={...safe,TUTOR_PROVIDER:'cloudflare',SPEECH_PROVIDER:'cloudflare',CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'test',CLOUDFLARE_FREE_PLAN_CONFIRMED:'true',PROVIDER_TERMS_REVIEWED:'true'};
 assert.equal(checkHostedApi(cloud),true);assert.throws(()=>checkHostedApi({...cloud,CLOUDFLARE_FREE_PLAN_CONFIRMED:'false'}));assert.throws(()=>checkHostedApi({...cloud,CLOUDFLARE_API_TOKEN:''}));
});

test('Firebase activation requires matching protected credentials, confirmed Spark and no emulator',()=>{
 const firebase={...safe,FIREBASE_AUTH_ENABLED:'true',FIREBASE_PROJECT_ID:'synthetic-project',FIREBASE_SPARK_PLAN_CONFIRMED:'true',FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify({project_id:'synthetic-project',private_key:'fixture-only',client_email:'fixture@example.invalid'})};
 assert.equal(checkHostedApi(firebase),true);
 for(const patch of [{FIREBASE_SPARK_PLAN_CONFIRMED:'false'},{FIREBASE_SERVICE_ACCOUNT_JSON:''},{FIREBASE_PROJECT_ID:'wrong-project'},{FIREBASE_AUTH_EMULATOR_HOST:'localhost:9099'}])assert.throws(()=>checkHostedApi({...firebase,...patch}));
});
