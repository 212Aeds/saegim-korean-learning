const {spawnSync}=require('node:child_process');
const result=spawnSync(process.execPath,[process.env.npm_execpath,'--workspace','@sori/web','run','build'],{
 stdio:'inherit',env:{...process.env,STATIC_PUBLISH:'true',SORI_WEB_DIST_DIR:'.next-local-speech',
 NEXT_PUBLIC_FREE_PUBLISHING:'true',NEXT_PUBLIC_PAID_FEATURES_ENABLED:'false',NEXT_PUBLIC_API_URL:'',
 NEXT_PUBLIC_LOCAL_SPEECH_URL:'http://127.0.0.1:5055'}});
process.exitCode=result.status??1;
