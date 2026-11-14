"use client";

import { useEffect } from "react";
import { installCloudflareAnalytics } from "./web-analytics";
import { canReportCrash } from "./crash-privacy";

export function CloudflareAnalytics() {
  useEffect(() => {
    let cancelled=false;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const prepare=()=>{
      timer=setTimeout(()=>{
        if (!cancelled && canReportCrash({hostname:location.hostname,pathname:location.pathname,doNotTrack:navigator.doNotTrack,globalPrivacyControl:(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl})) {
          void import('./crash-reporting').then(module=>{if(!cancelled)module.startCrashReporting();}).catch(()=>{});
        }
      },1500);
    };
    if(document.readyState==='complete')prepare();
    else window.addEventListener('load',prepare,{once:true});
    try {
      installCloudflareAnalytics(document, {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        doNotTrack: navigator.doNotTrack,
        globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl,
      });
    } catch { /* Analytics must never block learning. */ }
    return ()=>{cancelled=true;clearTimeout(timer);window.removeEventListener('load',prepare);};
  }, []);
  return null;
}
