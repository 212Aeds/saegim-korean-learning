// A dedicated reusable media element avoids keeping a Web Audio graph alive
// across microphone sessions. Muting remains an explicit learner preference.
let player:HTMLAudioElement|undefined,version=0;
let blocked=false;
const listeners=new Set<(value:boolean)=>void>();
export function feedbackSoundBlocked(){return blocked;}
export function subscribeFeedbackSound(listener:(value:boolean)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
function reportBlocked(value:boolean){blocked=value;for(const listener of listeners)listener(value);}
const clip='/audio/feedback/correct.wav';
const silence='data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
function muted(){try{return window.localStorage.getItem('saegim-feedback-muted')==='true';}catch{return false;}}
function soundPlayer(){
 if(typeof window==='undefined'||typeof Audio==='undefined'||muted())return;
 if(!player){player=new Audio(clip);player.preload='auto';}
 return player;
}
export function preparePracticeSounds(){try{soundPlayer();}catch{/* Optional preload. */}}
// Call synchronously from the microphone tap. A stale priming promise must not
// pause a correct-result sound which started while the promise was pending.
export function unlockPracticeSounds(){
 try{const audio=soundPlayer();if(!audio)return;const attempt=++version;audio.pause();audio.src=silence;
 void audio.play().then(()=>{if(attempt===version){audio.pause();audio.src=clip;}}).catch(()=>{});
 }catch{/* Feedback audio is optional. */}
}
export function playCorrectAnswerSound(){
 try{const audio=soundPlayer();if(!audio)return;const attempt=++version;audio.pause();if(!audio.src.endsWith(clip))audio.src=clip;
 try{audio.currentTime=0;}catch{/* The first tap can precede metadata loading. */}
 void audio.play().then(()=>{if(attempt===version)reportBlocked(false);}).catch(error=>{if(attempt===version&&error?.name!=="AbortError")reportBlocked(true);});
 }catch{/* A rejected play never disables later taps. */}
}
