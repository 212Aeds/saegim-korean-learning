import {positiveLimit,TUTOR_TOKEN_RESERVATION} from "./provider-usage.service";
type Counts={requests:number;tutorRequests:number;tutorTokens:string};
export function freeAllowance(today:Counts|null,env:NodeJS.ProcessEnv=process.env){
 const unknown={state:"unknown" as const,limit:null,used:null,remaining:null,accountLimit:null};
 if(env.TUTOR_PROVIDER!=="cloudflare")return unknown;
 const limit=positiveLimit(env.FREE_AI_PROJECT_DAILY_LIMIT)??200;
 const accountLimit=positiveLimit(env.FREE_AI_ACCOUNT_DAILY_LIMIT)??100;
 const used=today?.requests??0,tutor=today?.tutorRequests??0,tokens=Number(today?.tutorTokens??0);
 if(![used,tutor,tokens].every(n=>Number.isSafeInteger(n)&&n>=0))return unknown;
 const remaining=Math.max(0,Math.min(limit-used,limit-tutor,Math.floor((limit*TUTOR_TOKEN_RESERVATION-tokens)/TUTOR_TOKEN_RESERVATION)));
 return {state:remaining===0?"exhausted" as const:remaining<=Math.ceil(limit*.2)?"low" as const:"available" as const,limit,used,remaining,accountLimit};
}
