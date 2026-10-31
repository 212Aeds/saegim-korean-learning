type Breakdown={label:string;count:number};
type Data={visits:number;pageViews:number;performanceSamples:number;vitalSamples:number;pageLoadAvgMs:number|null;pageLoadP75Ms:number|null;lcpP75Ms:number|null;inpP75Ms:number|null;clsP75:number|null;referrals:Breakdown[];devices:Breakdown[];browsers:Breakdown[];countries:Breakdown[]};
export type TrafficSnapshot={state:"ready"|"stale"|"unavailable"|"unconfigured";measuredAt:string|null;periodStart:string|null;periodEnd:string|null;data:Data|null};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const count=(v:unknown):v is number=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0&&v<=1e12;
const date=(v:unknown):v is string=>typeof v==="string"&&Number.isFinite(Date.parse(v));
export function parseTraffic(value:unknown):TrafficSnapshot|null{
 if(!object(value)||!["ready","stale","unavailable","unconfigured"].includes(String(value.state)))return null;
 if(value.state==="unavailable"||value.state==="unconfigured")return value.data===null?{state:value.state,measuredAt:null,periodStart:null,periodEnd:null,data:null}:null;
 if(!date(value.measuredAt)||!date(value.periodStart)||!date(value.periodEnd)||Date.parse(value.periodEnd)-Date.parse(value.periodStart)!==86400000||!object(value.data))return null;
 const data=value.data,metrics:Record<string,number|null>={},groups:Record<string,Breakdown[]>={};
 for(const key of ["visits","pageViews","performanceSamples","vitalSamples"])if(!count(data[key]))return null;
 for(const key of ["pageLoadAvgMs","pageLoadP75Ms","lcpP75Ms","inpP75Ms","clsP75"]){const n=data[key];if(n!==null&&(typeof n!=="number"||!Number.isFinite(n)||n<0||n>1e9))return null;metrics[key]=n as number|null;}
 for(const key of ["referrals","devices","browsers","countries"]){const list=data[key];if(!Array.isArray(list)||list.length>5)return null;groups[key]=[];
  for(const row of list){if(!object(row)||typeof row.label!=="string"||row.label.length>80||!count(row.count))return null;groups[key].push({label:row.label,count:row.count});}
 }
 return {state:value.state as "ready"|"stale",measuredAt:value.measuredAt,periodStart:value.periodStart,periodEnd:value.periodEnd,data:{visits:data.visits as number,pageViews:data.pageViews as number,performanceSamples:data.performanceSamples as number,vitalSamples:data.vitalSamples as number,...metrics,...groups} as Data};
}
