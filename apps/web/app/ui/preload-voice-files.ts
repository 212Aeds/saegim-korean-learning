/** Download files after page load without initializing inference or allocating model buffers. */
let preparation:Promise<void>|undefined,controller:AbortController|undefined;
export function stopVoiceFilePreload(){controller?.abort();controller=undefined;}
export function preloadVoiceFiles(){
 if(preparation)return preparation;
 if(typeof caches==='undefined')return Promise.resolve();
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
 if(connection?.saveData)return Promise.resolve();
 const pending=controller=new AbortController();
 const timeout=setTimeout(()=>pending.abort(),120_000);
 const task=(async()=>{
  const response=await fetch('/voices/mobile-model-manifest.json',{signal:pending.signal});
  if(!response.ok)throw Error('Audio preparation unavailable');
  const manifest=await response.json();
  if(!/^[a-f0-9]{40}$/.test(manifest.revision)||!manifest.base.startsWith('https://huggingface.co/'))throw Error('Invalid audio manifest');
  const cache=await caches.open('saegim-supertonic-'+manifest.revision);
  for(const [name,file] of Object.entries(manifest.files) as [string,{path?:string}][]){
   if(pending.signal.aborted)return;
   const url=manifest.base+(file.path??name);
   if(await cache.match(url))continue;
   const asset=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:pending.signal});
   if(!asset.ok)throw Error('Audio preparation interrupted');
   // Cache API streams the response. The inference worker verifies size/hash before use.
   await cache.put(url,asset);
  }
 })().catch(()=>{}).finally(()=>{clearTimeout(timeout);if(controller===pending)controller=undefined;if(preparation===task)preparation=undefined;});
 preparation=task;return task;
}
