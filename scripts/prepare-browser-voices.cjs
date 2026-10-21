const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),web=path.join(root,'apps/web');
const dist=path.dirname(require.resolve('onnxruntime-web',{paths:[web]}));
const output=path.join(web,'public/voices/ort');fs.mkdirSync(output,{recursive:true});
for(const file of ['ort.webgpu.bundle.min.mjs',...fs.readdirSync(dist).filter(file=>/^ort-wasm-simd-threaded.*\.(mjs|wasm)$/.test(file))])fs.copyFileSync(path.join(dist,file),path.join(output,file));
fs.copyFileSync(path.join(web,'public/voices/ONNXRUNTIME-LICENSE.txt'),path.join(output,'LICENSE.txt'));
console.log('Prepared pinned browser voice runtime. Matching voices prepare automatically after the page opens.');
