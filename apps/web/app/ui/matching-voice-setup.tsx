"use client";
import {useEffect,useState} from "react";
import {browserVoiceState,prepareBrowserVoicesAutomatically,subscribeBrowserVoices,enableBrowserVoices,forgetBrowserVoiceConsent} from "./browser-voices";
import {recordedAudioEnabled,recordedAudioUrl} from "./recorded-audio";
import {currentVoiceDevicePolicy} from "./voice-device-policy";
import {usesBrowserConversationVoices} from "./speech";
export function MatchingVoiceSetup({text,voice}:{text:string;voice:"chris"|"jessica"}){
 const [state,setState]=useState(browserVoiceState);
 const policy=currentVoiceDevicePolicy();
 const needed=usesBrowserConversationVoices()&&!(recordedAudioEnabled&&recordedAudioUrl(text,voice));
 useEffect(()=>{const unsubscribe=subscribeBrowserVoices(setState);if(needed)void prepareBrowserVoicesAutomatically().catch(()=>{});return unsubscribe;},[needed]);
 if(!needed||state.phase==="ready")return null;
 return <section aria-label="Matching listening voices"><p>{policy.reason} Files are cached where storage allows.</p>{state.phase==="loading"?<><p role="status">Preparing voices · {state.progress}%</p><button type="button" className="button button-quiet" onClick={forgetBrowserVoiceConsent}>Cancel voice setup</button></>:policy.canLoad&&<button type="button" className="button button-soft" onClick={()=>void enableBrowserVoices().catch(()=>{})}>Prepare conversation voices</button>}{state.phase==="error"&&<p role="status">{state.message}</p>}</section>;
}
