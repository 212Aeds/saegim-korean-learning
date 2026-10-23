export function pauseOnPageLeave(
  pause:()=>void,
  page:Pick<Document,"hidden"|"addEventListener"|"removeEventListener">=document,
  host:Pick<Window,"addEventListener"|"removeEventListener">=window,
) {
  const visibility=()=>{if(page.hidden)pause();};
  page.addEventListener("visibilitychange",visibility);
  host.addEventListener("pagehide",pause);
  return ()=>{
    page.removeEventListener("visibilitychange",visibility);
    host.removeEventListener("pagehide",pause);
  };
}
