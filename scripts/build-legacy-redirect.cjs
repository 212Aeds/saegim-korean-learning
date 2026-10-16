// Retain old shared links without serving a second, outdated app build.
const fs=require('node:fs'),path=require('node:path');
const output=path.resolve(__dirname,'../.site-redirect');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'index.html'),`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Saegim has a new home</title><link rel="canonical" href="https://saegim.onrender.com/">
<meta http-equiv="refresh" content="0;url=https://saegim.onrender.com/">
<script>location.replace('https://saegim.onrender.com'+location.pathname+location.search+location.hash);</script>
</head><body><p>Saegim has a new home. <a href="https://saegim.onrender.com/">Continue to Saegim</a>.</p></body></html>`);
console.log('Prepared the legacy address handoff. Keep Render /api rewrite first, followed by the /* redirect.');
