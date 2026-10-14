import type {LearnerAccount} from "./account-modal";
export async function requestAccount(apiUrl:string,mode:"create"|"login",input:{email:string;password:string;displayName:string;learningProfile?:unknown}):Promise<LearnerAccount>{
 let response:Response;
 try{response=await fetch(`${apiUrl}/v1/auth/${mode==="create"?"register":"login"}`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),signal:AbortSignal.timeout(15000)});}
 catch{throw Error("The account service could not be reached. Your details are still here; try signing in again when it reconnects.");}
 const body=await response.json().catch(()=>null);
 if(!response.ok)throw Error(typeof body?.message==="string"?body.message:"The account service could not complete your request. Please try again.");
 if(!body||typeof body.id!=="string"||typeof body.email!=="string"||typeof body.displayName!=="string")throw Error("The account service returned an incomplete response. Please try again.");
 return body;
}
