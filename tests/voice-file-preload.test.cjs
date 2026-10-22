const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
test('background audio preparation shares downloads, reuses cache and respects data-saving mode without inference',async()=>{
 const nav=Object.getOwnPropertyDescriptor(global,'navigator'),old={fetch:global.fetch,caches:global.caches,Worker:global.Worker};let calls=[],saved=new Map();
 Object.defineProperty(global,'navigator',{configurable:true,value:{connection:{saveData:false}}});
 global.Worker=class{constructor(){throw Error('Background preparation must not initialize inference');}};
 global.caches={open:async()=>({match:async url=>saved.get(url),put:async(url,response)=>saved.set(url,response)})};
 const manifest={revision:'a'.repeat(40),base:'https://huggingface.co/example/resolve/revision/',files:{'onnx/model.onnx':{path:'compact/model.onnx'}}};
 global.fetch=async(url,options)=>{calls.push({url,options});return new Response(url.startsWith('/voices/')?JSON.stringify(manifest):'synthetic model bytes');};
 const preload=require('../apps/web/app/ui/preload-voice-files.ts');
 try{const first=preload.preloadVoiceFiles();assert.equal(preload.preloadVoiceFiles(),first);await first;assert.equal(calls.length,2);assert.equal(calls[1].options.credentials,'omit');assert.equal(calls[1].options.referrerPolicy,'no-referrer');await preload.preloadVoiceFiles();assert.equal(calls.length,3,'second visit reads the manifest and reuses cached asset');navigator.connection.saveData=true;await preload.preloadVoiceFiles();assert.equal(calls.length,3);}
 finally{preload.stopVoiceFilePreload();Object.assign(global,old);if(nav)Object.defineProperty(global,'navigator',nav);else delete global.navigator;}
});
