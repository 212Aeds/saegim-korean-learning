import {matchesPracticeAnswer} from "./speech-check";
export function speechAttempt(target:string,answer:string,romanization:string|undefined,source:"speech"|"written"){
 const matches=matchesPracticeAnswer(target,answer,romanization);
 return {matches,needsConfirmation:source==="speech"&&!matches,submit:source==="written"||matches};
}
