type Hints = {hostname:string; pathname?:string; doNotTrack?:string|null; globalPrivacyControl?:boolean};
export function canReportCrash(hints:Hints) {
  return hints.hostname === 'saegim.onrender.com' && !hints.globalPrivacyControl &&
    !['1','yes'].includes(hints.doNotTrack ?? '') &&
    !/^\/(developer|[a-z-]*preview)(\/|$)/.test(hints.pathname ?? '');
}

type CrashInput = {event_id?:string; timestamp?:number; exception?:{values?:Array<{type?:string; stacktrace?:{frames?:Array<{filename?:string; lineno?:number; colno?:number}>}}>}};
const errorTypes = new Set(['Error','TypeError','ReferenceError','SyntaxError','RangeError','URIError','EvalError','AggregateError']);

// Rebuild an allowlisted event instead of trying to redact unknown SDK fields.
export function sanitizeCrash(input:CrashInput) {
  const values = (input.exception?.values ?? []).slice(0,1).map(value => {
    const frames = (value.stacktrace?.frames ?? []).slice(-24).flatMap(frame => {
      try {
        const url = new URL(frame.filename ?? '');
        if (url.origin !== 'https://saegim.onrender.com' || !/^\/_next\/static\/(chunks|[^/]+)\/[a-zA-Z0-9_./%~-]+\.js$/.test(url.pathname)) return [];
        return [{filename:url.origin + url.pathname, in_app:true,
          ...(Number.isSafeInteger(frame.lineno) && frame.lineno! > 0 ? {lineno:frame.lineno} : {}),
          ...(Number.isSafeInteger(frame.colno) && frame.colno! > 0 ? {colno:frame.colno} : {})}];
      } catch { return []; }
    });
    return {type:errorTypes.has(value.type ?? '') ? value.type! : 'Error', value:'Browser error; message omitted for privacy', stacktrace:{frames}};
  }).filter(value => value.stacktrace.frames.length > 0);
  if (!values.length) return null;
  return {
    type:undefined,
    ...(/^[a-f0-9]{32}$/.test(input.event_id ?? '') ? {event_id:input.event_id} : {}),
    ...(Number.isFinite(input.timestamp) ? {timestamp:input.timestamp} : {}),
    platform:'javascript', environment:'production', release:'saegim-browser-errors-v1',
    exception:{values},
  };
}

export function createCrashFilter(maxReports=10) {
  const seen = new Set<string>();
  return (event:CrashInput) => {
    const clean = sanitizeCrash(event);
    if (!clean || seen.size >= maxReports) return null;
    const key = JSON.stringify(clean.exception);
    if (seen.has(key)) return null;
    seen.add(key);
    return clean;
  };
}
