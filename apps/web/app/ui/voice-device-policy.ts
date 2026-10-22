type DeviceHints={mobile?:boolean;memoryGB?:number;gpu?:boolean;saveData?:boolean;effectiveType?:string;connectionType?:string};
export function voicePreparationPolicy(hints:DeviceHints){
 const lowMemory=typeof hints.memoryGB==="number"&&hints.memoryGB>0&&hints.memoryGB<=4;
 const uncertainPhone=hints.mobile&&!hints.memoryGB;
 const canLoad=!lowMemory&&!uncertainPhone;
 const metered=hints.saveData||hints.connectionType==="cellular"||/^(slow-2g|2g|3g)$/.test(hints.effectiveType??"");
 return {canLoad,automatic:canLoad&&!hints.mobile&&!metered,reason:!canLoad?"To reduce crash risk on this device, new conversation replies stay as text. Recorded Chris/Jessica audio and microphone practice remain available.":hints.mobile||metered?"Recorded audio is ready without the large model. New spoken replies need about 430 MB; prepare them on Wi-Fi when convenient.":"Conversation voices prepare in the background."};
}
export function currentVoiceDevicePolicy(){
 if(typeof navigator==="undefined")return voicePreparationPolicy({});
 const device=navigator as Navigator&{deviceMemory?:number;userAgentData?:{mobile?:boolean};gpu?:unknown;connection?:{saveData?:boolean;effectiveType?:string;type?:string}};
 const mobile=Boolean(device.userAgentData?.mobile||/Android|iPhone|iPad|iPod/i.test(device.userAgent)||(device.platform==="MacIntel"&&device.maxTouchPoints>1));
 return voicePreparationPolicy({mobile,memoryGB:device.deviceMemory,gpu:!!device.gpu,saveData:device.connection?.saveData,effectiveType:device.connection?.effectiveType,connectionType:device.connection?.type});
}
