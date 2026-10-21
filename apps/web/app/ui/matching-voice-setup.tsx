"use client";
import {useEffect,useState} from "react";
import {browserVoiceState,browserVoicesConsented,subscribeBrowserVoices,enableBrowserVoices,forgetBrowserVoiceConsent} from "./browser-voices";
import {recordedAudioEnabled,recordedAudioUrl} from "./recorded-audio";
import {usesBrowserConversationVoices} from "./speech";
export function MatchingVoiceSetup({text,voice}:{text:string;voice:"chris"|"jessica"}){
 const [state,setState]=useState(browserVoiceState);
 const needed=usesBrowserConversationVoices()&&!(recordedAudioEnabled&&recordedAudioUrl(text,voice));
 useEffect(()=>{const unsubscribe=subscribeBrowserVoices(setState);if(needed&&browserVoicesConsented())void enableBrowserVoices().catch(()=>{});return unsubscribe;},[needed]);
 if(!needed||state.phase==="ready")return null;
 return <section aria-label="Matching listening voices"><p>This sample uses the same Chris and Jessica voices. Set them up once, then tap Listen again. Optional download: about 430 MB; files are cached where storage allows.</p>{state.phase==="loading"?<><p role="status">Preparing voices · {state.progress}%</p><button type="button" className="button button-quiet" onClick={forgetBrowserVoiceConsent}>Cancel voice setup</button></>:<button type="button" className="button button-soft" onClick={()=>void enableBrowserVoices().catch(()=>{})}>Set up Chris &amp; Jessica</button>}{state.phase==="error"&&<p role="status">{state.message}</p>}</section>;
}
