const pauseKey="saegim-recording-pause-ms";
export function preferredRecordingPause(fallback=3000) {
  if(typeof window === "undefined")return fallback;
  try {const value=Number(window.localStorage.getItem(pauseKey));return [3000,5000,10000].includes(value)?value:fallback;} catch{return fallback;}
}
export function saveRecordingPause(value:number) {
  if(![3000,5000,10000].includes(value)||typeof window === "undefined")return;
  try {window.localStorage.setItem(pauseKey,String(value));}catch{}
}
