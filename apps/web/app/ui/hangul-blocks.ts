import * as Hangul from "hangul-js";
import {lessons} from "../curriculum";
import {hangulSyllableExamples} from "../more-lessons";
import manifest from "../audio-manifest.json";
import {placementKnowledge,type LearningProfile} from "../learning-profile";
export function eligibleHangulBlocks(completed:string[],profile:LearningProfile){
 const known=new Set(["ㄱ","ㅏ"]); // Guided starter letters from Hello, Hangul.
 const covered=new Set([...completed,...placementKnowledge(profile)]);
 for(const lesson of lessons)if(covered.has(lesson.id))for(const word of lesson.words)if(/^[ㄱ-ㅎㅏ-ㅣ]$/u.test(word))known.add(word);
 const clips=manifest as Record<string,string>;
 return hangulSyllableExamples.filter(sample=>sample.letters.length===2&&sample.letters.every(letter=>known.has(letter))&&clips[`chris|${sample.korean}`]&&clips[`jessica|${sample.korean}`]);
}
export function composeHangulBlock(consonant:string,vowel:string){
 if(!/^[ㄱ-ㅎ]$/u.test(consonant)||!/^[ㅏ-ㅣ]$/u.test(vowel))return "";
 const block=Hangul.assemble([consonant,vowel]);return /^[가-힣]$/u.test(block)?block:"";
}
