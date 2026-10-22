type DeviceHints={mobile?:boolean;memoryGB?:number;gpu?:boolean;saveData?:boolean;effectiveType?:string;connectionType?:string};
export function voicePreparationPolicy(hints:DeviceHints){
 const profile=hints.mobile?"mobile":"desktop";
 const lowMemory=typeof hints.memoryGB==="number"&&hints.memoryGB>0&&hints.memoryGB<=(hints.mobile?2:4);
 const canLoad=!lowMemory;
 const metered=hints.saveData||hints.connectionType==="cellular"||/^(slow-2g|2g|3g)$/.test(hints.effectiveType??"");
 return {profile,canLoad,automatic:canLoad&&!hints.mobile&&!metered,reason:!canLoad?"To reduce crash risk on this device, new conversation replies stay as text. Recorded Chris/Jessica audio and microphone practice remain available.":hints.mobile?"Chris and Jessica use a smaller 106 MB voice download on phones. Prepare once on Wi-Fi; saved files are reused when your browser permits. First-time setup can take a while.":metered?"Recorded audio is ready. Conversation voices need about 399 MB; prepare on Wi-Fi when convenient.":"Conversation voices prepare in the background."};
}
export function currentVoiceDevicePolicy(){
 if(typeof navigator==="undefined")return voicePreparationPolicy({});
 const device=navigator as Navigator&{deviceMemory?:number;userAgentData?:{mobile?:boolean};gpu?:unknown;connection?:{saveData?:boolean;effectiveType?:string;type?:string}};
 const mobile=Boolean(device.userAgentData?.mobile||/Android|iPhone|iPad|iPod/i.test(device.userAgent)||(device.platform==="MacIntel"&&device.maxTouchPoints>1));
 return voicePreparationPolicy({mobile,memoryGB:device.deviceMemory,gpu:!!device.gpu,saveData:device.connection?.saveData,effectiveType:device.connection?.effectiveType,connectionType:device.connection?.type});
}
