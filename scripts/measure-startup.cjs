const fs=require("node:fs"),path=require("node:path"),zlib=require("node:zlib");
const root=path.resolve(__dirname,"../apps/web/.next-hosted-public");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const files=[...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match=>match[1]))];
let raw=0,gzip=0;
for(const file of files){const resolved=path.resolve(root,"."+file);if(!resolved.startsWith(root+path.sep))throw Error("Unexpected script path");const bytes=fs.readFileSync(resolved);raw+=bytes.length;gzip+=zlib.gzipSync(bytes).length;}
console.log(JSON.stringify({metric:"JavaScript files referenced by exported home HTML, including legacy polyfills",scripts:files.length,rawBytes:raw,gzipBytes:gzip},null,2));
// This is a reproducible build-size budget, not a browser timing score.
if(!files.length||gzip>360000){console.error("Startup script budget exceeded (360000 gzip bytes). Inspect the build before publishing.");process.exitCode=1;}
