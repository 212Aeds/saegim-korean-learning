"use client";
import {useEffect,useState} from "react";
import {browserVoiceState,subscribeBrowserVoices,enableBrowserVoices,forgetBrowserVoiceConsent} from "./browser-voices";
import {recordedAudioEnabled,recordedAudioUrl} from "./recorded-audio";
import {usesBrowserConversationVoices} from "./speech";
export function MatchingVoiceSetup({text,voice}:{text:string;voice:"chris"|"jessica"}){
 const [state,setState]=useState(browserVoiceState);
 const needed=usesBrowserConversationVoices()&&!(recordedAudioEnabled&&recordedAudioUrl(text,voice));
 useEffect(()=>{const unsubscribe=subscribeBrowserVoices(setState);if(needed)void enableBrowserVoices().catch(()=>{});return unsubscribe;},[needed]);
 if(!needed||state.phase==="ready")return null;
 return <section aria-label="Matching listening voices"><p>This sample uses the same Chris and Jessica voices. They prepare automatically in the background (about 430 MB on the first visit). Files are cached where storage allows.</p>{state.phase==="loading"?<><p role="status">Preparing voices · {state.progress}%</p><button type="button" className="button button-quiet" onClick={forgetBrowserVoiceConsent}>Cancel voice setup</button></>:<button type="button" className="button button-soft" onClick={()=>void enableBrowserVoices().catch(()=>{})}>Retry voice preparation</button>}{state.phase==="error"&&<p role="status">{state.message}</p>}</section>;
}
