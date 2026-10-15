const {URL}=require('node:url');
function checkHostedApi(env) {
 if(env.NODE_ENV!=='production') throw Error('Hosted API requires production mode.');
 if(env.PAID_FEATURES_ENABLED!=='false' || env.PROVIDER_MONTHLY_SPEND_CAP_CENTS!=='0' || env.TUTOR_PROVIDER!=='disabled' || env.OPENROUTER_AUDIO_ENABLED!=='false') throw Error('Hosted API must keep paid providers and unprovisioned AI disabled.');
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
if(require.main===module) {try {checkHostedApi(process.env);console.log('Hosted API configuration passed. AI and paid fallbacks remain disabled.');} catch(error){console.error(error.message);process.exitCode=1;}}
