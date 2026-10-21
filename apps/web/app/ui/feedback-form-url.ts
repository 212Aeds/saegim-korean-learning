import feedback from "../feedback-config.json";
export function feedbackFormUrl(report:string,area:string){
 const url=new URL(feedback.prefill.url);
 if(url.origin!=="https://docs.google.com"||!url.pathname.startsWith("/forms/d/e/")||!url.pathname.endsWith("/viewform"))throw Error("Invalid feedback form destination");
 url.searchParams.set("usp","pp_url");
 url.searchParams.set(feedback.prefill.nameEntry,"Anonymous Saegim learner");
 url.searchParams.set(feedback.prefill.reportEntry,report.slice(0,3000));
 url.searchParams.set(feedback.prefill.areaEntry,area.slice(0,60));
 return url.toString();
}
