const pad=(n:number)=>String(n).padStart(2,"0");
const localDate=(d:Date)=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
export function studyReminder(time:string,frequency:"daily"|"weekly",now=new Date(),id=crypto.randomUUID()){
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!["daily","weekly"].includes(frequency)||!Number.isFinite(now.getTime())||!/^[a-zA-Z0-9-]{1,64}$/.test(id))throw Error("Choose a valid reminder time.");
 const start=new Date(now);const [hours,minutes]=time.split(":").map(Number);start.setHours(hours,minutes,0,0);if(start<=now)start.setDate(start.getDate()+1);
 const stamp=now.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Saegim//Optional study reminder//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${id}@saegim.onrender.com`,`DTSTAMP:${stamp}`,`DTSTART:${localDate(start)}`,"DURATION:PT5M",`RRULE:FREQ=${frequency.toUpperCase()};COUNT=${frequency==="daily"?14:8}`,"SUMMARY:A little Korean - if you have time","DESCRIPTION:One small practice is enough. Breaks are welcome.","URL:https://saegim.onrender.com/","TRANSP:TRANSPARENT","BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:PT0M","DESCRIPTION:A little Korean - at your own pace.","END:VALARM","END:VEVENT","END:VCALENDAR",""] .join("\r\n");
}
