import {stopVoiceFilePreload} from "./preload-voice-files";
import {currentVoiceDevicePolicy} from "./voice-device-policy";
export type BrowserVoiceState={phase:"idle"|"loading"|"ready"|"error";progress:number;message:string};
let state:BrowserVoiceState={phase:"idle",progress:0,message:""};
const clips=new Map<string,Blob>();
const listeners=new Set<(value:BrowserVoiceState)=>void>();
const pending=new Map<number,{resolve:(value:ArrayBuffer|undefined)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
let worker:Worker|undefined,sequence=0,initializing:Promise<void>|undefined;
const consentKey="saegim-conversation-voices-v1";
let playbackElement:HTMLAudioElement|undefined;
const silentAudio="data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
export function primeBrowserVoicePlayback(){
  if(typeof Audio==="undefined")return;
  playbackElement??=new Audio();
  if(playbackElement.src&&!playbackElement.src.startsWith("data:"))return;
  playbackElement.src=silentAudio;
  void playbackElement.play().then(()=>{if(playbackElement?.src===silentAudio)playbackElement.pause();}).catch(()=>{});
}
export function browserVoicePlaybackElement(){return playbackElement??=new Audio();}

function update(next:BrowserVoiceState){state=next;for(const listener of listeners)listener(state);}
export function browserVoiceState(){return state;}
export function subscribeBrowserVoices(listener:(value:BrowserVoiceState)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function browserVoicesConsented(){try{return typeof window!=="undefined"&&window.localStorage.getItem(consentKey)==="true";}catch{return false;}}
function connect(){
  if(worker)return worker;
  const connected=worker=new Worker('/voices/worker.js',{type:"module"});
  worker.onmessage=({data})=>{
    if(worker!==connected)return;
    if(data.type==="progress"){if(state.phase==="loading")update({phase:"loading",progress:data.progress,message:data.message});return;}
    const item=pending.get(data.id);if(!item)return;pending.delete(data.id);clearTimeout(item.timer);
    if(data.type==="error"){item.reject(new Error(data.message));cancelBrowserVoices(data.message);}else item.resolve(data.wav);
  };
  worker.onerror=()=>{if(worker===connected)cancelBrowserVoices("Voice setup could not finish. Retry, or continue by text.");};
  return worker;
}
function request(type:"initialize"|"synthesize",fields:Record<string,unknown>={},signal?:AbortSignal){
  return new Promise<ArrayBuffer|undefined>((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException("Canceled","AbortError"));return;}
    const id=++sequence;
    const abort=()=>{cancelBrowserVoices();};
    const settle=(callback:()=>void)=>{signal?.removeEventListener("abort",abort);callback();};
    const timer=setTimeout(()=>cancelBrowserVoices("Voice preparation took too long. Retry, or continue by text."),type==="initialize"?600_000:120_000);
    pending.set(id,{resolve:value=>settle(()=>resolve(value)),reject:error=>settle(()=>reject(error)),timer});
    signal?.addEventListener("abort",abort,{once:true});
    try{connect().postMessage({id,type,...fields});}catch{cancelBrowserVoices("These voices are unavailable in this browser.");}
  });
}
export function cancelBrowserVoices(message=""){
  worker?.terminate();worker=undefined;initializing=undefined;clips.clear();
  for(const item of pending.values()){clearTimeout(item.timer);item.reject(new DOMException("Canceled","AbortError"));}pending.clear();
  update({phase:message?"error":"idle",progress:0,message});
}
export function forgetBrowserVoiceConsent(){try{window.localStorage.removeItem(consentKey);}catch{}cancelBrowserVoices();}
export function enableBrowserVoices(){
  const policy=currentVoiceDevicePolicy();if(!policy.canLoad){update({phase:"error",progress:0,message:policy.reason});return Promise.reject(new Error(policy.reason));}
  stopVoiceFilePreload();
  primeBrowserVoicePlayback();
  if(state.phase==="ready")return Promise.resolve();
  if(initializing)return initializing;
  try{window.localStorage.setItem(consentKey,"true");}catch{}
  update({phase:"loading",progress:0,message:"Preparing Chris and Jessica…"});
  const task=request("initialize",{profile:policy.profile}).then(()=>update({phase:"ready",progress:100,message:"Chris and Jessica are ready."})).catch(error=>{if(error?.name!=="AbortError")update({phase:"error",progress:0,message:"Voice setup could not finish. Retry, or continue by text."});throw error;}).finally(()=>{if(initializing===task)initializing=undefined;});
  initializing=task;return task;
}
export function cachedBrowserVoice(text:string,voice:"chris"|"jessica"){return clips.get(voice+"|"+text);}
export async function synthesizeBrowserVoice(text:string,voice:"chris"|"jessica",signal:AbortSignal){
  if(state.phase!=="ready")throw Error("Set up Chris and Jessica first.");
  const key=voice+"|"+text;const saved=clips.get(key);if(saved&&!signal.aborted)return saved;
  const wav=await request("synthesize",{text,voice},signal);
  if(!wav||signal.aborted)throw new DOMException("Canceled","AbortError");
  const blob=new Blob([wav],{type:"audio/wav"});clips.set(key,blob);if(clips.size>6)clips.delete(clips.keys().next().value!);return blob;
}

export function prepareBrowserVoicesAutomatically(){if(currentVoiceDevicePolicy().automatic)return enableBrowserVoices();return Promise.resolve();}
