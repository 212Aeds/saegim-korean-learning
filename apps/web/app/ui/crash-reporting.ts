import {canReportCrash, createCrashFilter} from './crash-privacy';
import {init, globalHandlersIntegration} from '@sentry/browser';

let installed=false;
export function startCrashReporting() {
  const allowed=()=>canReportCrash({hostname:location.hostname,pathname:location.pathname,doNotTrack:navigator.doNotTrack,globalPrivacyControl:(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl});
  if (installed || !allowed()) return;
  installed=true;
  const filter=createCrashFilter();
  init({
    // Public ingestion identifier, not an administrative credential.
    dsn:'https://3626cfe33f0ef542656529d8c9005473@o4512429428703232.ingest.us.sentry.io/4512429434077184',
    defaultIntegrations:false,
    integrations:[globalHandlersIntegration({onerror:true,onunhandledrejection:true})],
    dataCollection:{userInfo:false,cookies:false,httpHeaders:false,httpBodies:[],urlQueryParams:false,genAI:{inputs:false,outputs:false},stackFrameVariables:false,frameContextLines:0},
    sendClientReports:false,
    maxBreadcrumbs:0,
    tracesSampleRate:0,
    replaysSessionSampleRate:0,
    replaysOnErrorSampleRate:0,
    beforeSend:event=>allowed() ? filter(event) : null,
  });
}
