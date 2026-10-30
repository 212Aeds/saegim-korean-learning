const {URL}=require('node:url');
function checkHostedApi(env) {
 if(env.NODE_ENV!=='production') throw Error('Hosted API requires production mode.');
 if(env.PAID_FEATURES_ENABLED!=='false' || env.PROVIDER_MONTHLY_SPEND_CAP_CENTS!=='0' || !['disabled','cloudflare'].includes(env.TUTOR_PROVIDER) || env.OPENROUTER_AUDIO_ENABLED!=='false') throw Error('Hosted API must keep paid providers and unprovisioned AI disabled.');
 if(env.TUTOR_PROVIDER==='cloudflare' || env.SPEECH_PROVIDER==='cloudflare') {
  if(env.CLOUDFLARE_FREE_PLAN_CONFIRMED!=='true' || !/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID||'') || !env.CLOUDFLARE_API_TOKEN?.trim() || env.PROVIDER_TERMS_REVIEWED!=='true')throw Error('Configure Cloudflare server secrets and confirm the Workers Free plan and data terms before enabling AI.');
 }
 if(env.FIREBASE_AUTH_ENABLED==='true') {
  let credentials;
  try { credentials=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON||''); } catch { throw Error('Configure the Firebase server credential in hosting secrets before enabling Google sign-in.'); }
  if(env.FIREBASE_SPARK_PLAN_CONFIRMED!=='true' || !env.FIREBASE_PROJECT_ID || credentials.project_id!==env.FIREBASE_PROJECT_ID || typeof credentials.private_key!=='string' || typeof credentials.client_email!=='string' || env.FIREBASE_AUTH_EMULATOR_HOST) throw Error('Google sign-in requires the confirmed Spark project, matching server credential, and production token verification.');
 }
 let database;
 try { database=new URL(env.DATABASE_URL); } catch { throw Error('Set DATABASE_URL in the hosting secret settings.'); }
 if(!['postgres:','postgresql:'].includes(database.protocol) || !['require','verify-full'].includes(database.searchParams.get('sslmode'))) throw Error('Use a PostgreSQL connection string with sslmode=require or verify-full.');
 const origins=(env.WEB_ORIGINS||'').split(',').map(value=>value.trim());
 if(!origins.length || origins.some(value=>{
  try { const url=new URL(value); return url.origin!==value || url.protocol!=='https:' || !url.hostname.includes('.') || /^(localhost|127\.|10\.|192\.168\.|0\.)/i.test(url.hostname) || /\.(localhost|test|invalid)$/.test(url.hostname); } catch { return true; }
 })) throw Error('Set WEB_ORIGINS to the exact public HTTPS website origins, without paths or wildcards.');
 return true;
}
module.exports={checkHostedApi};
if(require.main===module) {try {checkHostedApi(process.env);console.log('Hosted API configuration passed. Paid fallbacks remain disabled.');} catch(error){console.error(error.message);process.exitCode=1;}}
