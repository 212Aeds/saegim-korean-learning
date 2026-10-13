const {spawnSync}=require('node:child_process');
if(!process.env.npm_execpath)throw Error('Run npm run build:free');
const result=spawnSync(process.execPath,[process.env.npm_execpath,'--workspace','@sori/web','run','build'],{stdio:'inherit',env:{...process.env,STATIC_PUBLISH:'true',SORI_WEB_DIST_DIR:'.next-public',NEXT_PUBLIC_FREE_PUBLISHING:'true',NEXT_PUBLIC_PAID_FEATURES_ENABLED:'false',NEXT_PUBLIC_API_URL:''}});
process.exitCode=result.status??1;
