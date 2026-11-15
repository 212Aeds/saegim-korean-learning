"use client";
import {useEffect,useRef,useState} from 'react';
import {recordConversationTurn} from './conversation-recording';
import {playElevenLabsKorean,stopKoreanPlayback,type ElevenLabsVoice} from './speech';

export function PronunciationComparison({korean,voice,pace}:{korean:string;voice:ElevenLabsVoice;pace:number}) {
  const [state,setState]=useState<'ready'|'starting'|'recording'|'playing'>('ready');
  const [notice,setNotice]=useState('Listen to the example, record yourself, then compare. This recording stays in memory on this device.');
  const [hasClip,setHasClip]=useState(false);
  const controller=useRef<AbortController|null>(null),finish=useRef<(()=>void)|null>(null);
  const clip=useRef<string|null>(null),player=useRef<HTMLAudioElement|null>(null),version=useRef(0),busy=useRef(false);
  function discard(){player.current?.pause();player.current=null;if(clip.current)URL.revokeObjectURL(clip.current);clip.current=null;setHasClip(false);}
  function cancel(){version.current++;controller.current?.abort();finish.current=null;busy.current=false;player.current?.pause();stopKoreanPlayback();setState('ready');setNotice('Stopped. Choose an example or recording when ready.');}
  useEffect(()=>{
    const hide=()=>{if(document.hidden){cancel();setNotice('Practice paused. Tap a button when you return.');}};
    document.addEventListener('visibilitychange',hide);
    return()=>{document.removeEventListener('visibilitychange',hide);version.current++;controller.current?.abort();player.current?.pause();if(clip.current)URL.revokeObjectURL(clip.current);stopKoreanPlayback();};
  },[]);
  async function record(){
    if(busy.current)return;busy.current=true;discard();
    const attempt=++version.current,current=new AbortController();controller.current=current;
    setState('starting');setNotice('Allow microphone access if asked. Wait for Recording before speaking.');stopKoreanPlayback();
    try{
      const wav=await recordConversationTurn(current.signal,()=>{}, {manualStop:true,maxSeconds:20,onReady:stop=>{
        if(attempt!==version.current)return;finish.current=stop;
        if(stop){setState('recording');setNotice('Recording. Tap Stop recording when finished; maximum 20 seconds.');}
      }});
      if(attempt!==version.current||current.signal.aborted)return;
      clip.current=URL.createObjectURL(new Blob([wav],{type:'audio/wav'}));setHasClip(true);setNotice('Your recording is ready. Compare sounds and rhythm with the example. This is not a pronunciation score.');
    }catch(error){if(attempt===version.current)setNotice(error instanceof DOMException&&error.name==='NotAllowedError'?'Microphone permission is blocked. You can still listen to the example.':'Recording could not finish. Try again, or keep practicing with the example.');}
    finally{if(attempt===version.current){finish.current=null;busy.current=false;setState('ready');}}
  }
  async function listen(own:boolean){
    if(busy.current || (own&&!clip.current))return;
    busy.current=true;const attempt=++version.current;setState('playing');setNotice(own?'Playing your recording…':'Preparing the example…');
    try{
      if(own){
        const audio=new Audio(clip.current!);player.current=audio;
        audio.onended=()=>{if(attempt===version.current){busy.current=false;setState('ready');setNotice('Compare again whenever you like.');}};
        audio.onerror=()=>{if(attempt===version.current){busy.current=false;setState('ready');setNotice('Playback could not finish. Try again.');}};
        await audio.play();
      }else{
        const result=await playElevenLabsKorean(korean,voice,pace,{consistentVoice:true,naturalOnly:true,waitForEnd:true});
        if(attempt===version.current){busy.current=false;setState('ready');setNotice(result.played?'Now listen to your own recording, or record a new attempt.':'The example could not play. Try Listen again.');}
      }
    }catch{if(attempt===version.current){busy.current=false;setState('ready');setNotice('Audio could not start. Tap the button to try again.');}}
  }
  return <section className="speech-practice pronunciation-comparison" aria-label="Compare your pronunciation">
    <span className="micro-label">LISTEN & COMPARE</span><h3>Hear the difference yourself.</h3>
    <p>Same example and selected voice. Record only when you choose; nothing from this comparison is uploaded or saved to your account.</p>
    <div className="speech-actions">
      <button type="button" className="button button-soft" disabled={state!=='ready'} onClick={()=>void listen(false)}>Listen to example</button>
      <button type="button" className="button button-dark" disabled={state!=='ready'} onClick={()=>void record()}>{hasClip?'Record again':'Record my voice'}</button>
      {(state==='starting'||state==='recording')&&<button type="button" className="button button-quiet" onClick={()=>{if(finish.current)finish.current();else cancel();}}> {state==='starting'?'Cancel microphone request':'Stop recording'}</button>}
      {state==='playing'&&<button type="button" className="button button-quiet" onClick={cancel}>Stop audio</button>}
      {hasClip&&<><button type="button" className="button button-soft" disabled={state!=='ready'} onClick={()=>void listen(true)}>Listen to my recording</button><button type="button" className="text-link" disabled={state!=='ready'} onClick={()=>{discard();setNotice('Recording removed from memory.');}}>Discard recording</button></>}
    </div><p role="status">{notice}</p>
  </section>;
}
