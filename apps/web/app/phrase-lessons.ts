import type { Lesson } from "./curriculum";
import { opinionSpeaking } from "./opinion-speaking";

type PhraseLine = readonly [id: string, korean: string, meaning: string, focus: string, focusMeaning: string, tip: string];
type PhraseChapter = {id: string; title: string; level: "foundation" | "intermediate" | "stretch"; prerequisite: string; focus: string; lines: readonly PhraseLine[]};
// App-authored contextual practice, with dictionary references on lesson/card views.
const chapters: PhraseChapter[] = [
  {id:"phrase-greetings",title:"Greetings: start and end a chat",level:"intermediate",prerequisite:"polite-past",focus:"Greet someone, ask a follow-up, and close the exchange.",lines:[
    ["hello-feeling","안녕하세요. 오늘 기분이 어때요?","Hello. How are you feeling today?","기분","mood; feeling","어때요 asks how something is. Use 기분 to ask about someone's mood or feeling."],
    ["long-time","오랜만이에요. 잘 지냈어요?","Long time no see. Have you been well?","오랜만","a long time since something last happened","잘 지냈어요 asks how someone has been, using the polite past tense."],
    ["meet-learning","만나서 반가워요. 저는 한국어를 배우고 있어요.","Nice to meet you. I am learning Korean.","한국어","Korean language","만나서 반가워요 is a polite first-meeting greeting; -고 있어요 describes ongoing learning."],
    ["talk-again","다음에 또 이야기해요. 좋은 하루 보내세요.","Let's talk again another time. Have a good day.","하루","a day","다음에 means next time. 좋은 하루 보내세요 wishes the other person a good day."],
  ]},
  {id:"phrase-meals",title:"Food: share a meal",level:"intermediate",prerequisite:"at-the-cafe",focus:"Talk about food preferences and make a polite request.",lines:[
    ["spicy-food","매운 음식을 잘 못 먹어요.","I cannot eat spicy food very well.","음식","food","잘 못 describes difficulty doing something; 매운 modifies 음식 as spicy."],
    ["without-meat","고기 없이 만들어 주실 수 있어요?","Could you make it without meat?","고기","meat","없이 means without. -아/어 주실 수 있어요 politely asks whether someone can do something for you."],
    ["food-ingredients","이 음식에는 뭐가 들어가요?","What ingredients are in this food?","재료","ingredient","뭐가 asks what is included. 들어가요 can describe an ingredient being put into a dish."],
    ["dinner-together","같이 저녁 먹을까요?","Shall we have dinner together?","저녁","evening; dinner","같이 means together, and -(으)ㄹ까요 suggests an action together."],
  ]},
  {id:"phrase-courtesy",title:"Small polite replies",level:"foundation",prerequisite:"hello-there",focus:"Short polite replies for everyday encounters.",lines:[
    ["thanks-reply","아니에요. 괜찮아요.","Not at all. It is okay.","괜찮다","to be okay","아니에요 can politely answer thanks; 괜찮아요 reassures the other person."],
    ["wait","잠깐만요.","Just a moment, please.","잠깐","a moment","잠깐만요 is a brief polite request to wait."],
    ["understood","네, 알겠어요.","Yes, I understand.","알다","to know","알겠어요 acknowledges that you understand what was said."],
    ["help-thanks","도와줘서 고마워요.","Thank you for helping me.","고맙다","to be thankful","-아/어 줘서 고마워요 thanks someone for doing something for you. Use a more respectful form with people who require honorifics."],
  ]},
  {id:"phrase-cafe",title:"Café: small requests",level:"intermediate",prerequisite:"conversation-cafe",focus:"Make a request and respond while ordering.",lines:[
    ["takeaway","포장해 주세요.","Please make it takeaway.","포장","packing; wrapping","포장해 주세요 requests food or a drink to take away."],
    ["less-ice","얼음을 조금만 넣어 주세요.","Please add just a little ice.","얼음","ice","조금만 means just a little; 넣어 주세요 politely asks someone to put something in."],
    ["without-sugar","설탕은 빼 주세요.","Please leave out the sugar.","설탕","sugar","빼 주세요 asks for something to be left out; 은 highlights sugar as the item."],
    ["recommendation","어떤 차가 맛있어요?","Which tea tastes good?","차","tea","어떤 asks which kind; 가 marks the tea you are asking about."],
  ]},
  {id:"phrase-travel",title:"Travel: ask for help",level:"intermediate",prerequisite:"transport-dialogue",focus:"Ask about a route, a stop, and travel time.",lines:[
    ["station-walk","역까지 걸어갈 수 있어요?","Can I walk to the station?","역","station","까지 marks the destination limit; 걸어갈 수 있어요 asks whether walking there is possible."],
    ["bus-stop","이 버스는 어디에 서요?","Where does this bus stop?","버스","bus","서요 is the polite form of 서다, to stop or stand; here a bus is stopping at a place."],
    ["travel-time","공항까지 얼마나 걸려요?","How long does it take to get to the airport?","공항","airport","얼마나 걸려요 asks how much time the journey takes."],
    ["leave-here","여기서 내려도 돼요?","May I get off here?","여기","here","-아/어도 돼요 asks whether an action is permitted or okay."],
  ]},
  {id:"phrase-family",title:"Family: keep in touch",level:"intermediate",prerequisite:"family-dialogue",focus:"Check in, ask after someone, and arrange another call.",lines:[
    ["meal-check","오늘 밥 먹었어요?","Have you eaten today?","밥","rice; a meal","밥 먹었어요 asks whether someone has had a meal. Use honorifics when speaking to elders who expect them."],
    ["weekend-call","주말에 전화할게요.","I will call you at the weekend.","전화","telephone; a call","-(으)ㄹ게요 offers your intention to the listener; 에 marks when."],
    ["photo-request","사진 좀 보내 주세요.","Please send me a photo.","사진","photo","좀 softens the request; 보내 주세요 asks someone to send something."],
    ["hear-voice","목소리를 들으니까 반가워요.","It is lovely to hear your voice.","목소리","voice","-(으)니까 gives the reason for the speaker's feeling; 반가워요 expresses pleasure at meeting or hearing from someone."],
  ]},
  {id:"phrase-opinion-life",title:"Opinions: learning and daily life",level:"stretch",prerequisite:"opinions-dialogue",focus:"Connect a personal view with a reason or a condition.",lines:[opinionSpeaking[0],opinionSpeaking[2],opinionSpeaking[3],opinionSpeaking[5]]},
  {id:"phrase-opinion-preferences",title:"Opinions: compare choices",level:"stretch",prerequisite:"opinions-dialogue",focus:"Compare preferences and make room for another view.",lines:[opinionSpeaking[1],opinionSpeaking[4],opinionSpeaking[6],opinionSpeaking[7]]},
  {id:"phrase-opinion-reasons",title:"Opinions: explain your reasons",level:"stretch",prerequisite:"phrase-opinion-life",focus:"Support your answer with a reason, a contrast, or a purpose.",lines:[
    ["study-home","저는 집에서 공부하는 게 더 편해요. 필요한 책을 바로 찾을 수 있어요.","Studying at home is more comfortable for me. I can find the books I need right away.","책","book","게 is a shortened 것이; the second sentence explains the preference using -(으)ㄹ 수 있어요."],
    ["lasting-method","이 방법은 시간이 더 걸리지만 오래 기억하는 데 도움이 돼요.","This method takes longer, but it helps me remember for a long time.","시간","time","-지만 introduces a contrast. -는 데 도움이 돼요 describes what an action helps with."],
    ["weekend-time","매일 연습하기는 어렵지만 주말에는 시간을 낼 수 있어요.","Practicing every day is difficult, but I can make time at the weekend.","연습","practice","-기는 highlights the action as a topic; -지만 contrasts the difficulty with another possibility."],
    ["family-purpose","가족과 자주 이야기하려고 한국어를 배우고 있어요.","I am learning Korean so that I can talk with my family often.","가족","family","-(으)려고 expresses the purpose of learning; -고 있어요 describes an ongoing activity."],
  ]},
  {id:"phrase-opinion-discussion",title:"Opinions: keep a discussion going",level:"stretch",prerequisite:"phrase-opinion-preferences",focus:"Acknowledge another view, suggest a next step, or ask for thinking time.",lines:[
    ["other-experience","그 말도 이해해요. 하지만 제 경험은 조금 달랐어요.","I understand that point too. But my experience was a little different.","경험","experience","도 acknowledges the other point; 하지만 introduces a contrasting personal experience."],
    ["small-goal","좋은 생각이에요. 먼저 작은 목표부터 정해 볼까요?","That is a good idea. Shall we start by setting a small goal?","생각","thought; idea","부터 gives the starting point. -아/어 볼까요 suggests trying an action together."],
    ["both-methods","저는 두 가지 방법을 같이 써 보는 게 좋다고 생각해요.","I think it would be good to try using both methods together.","생각","thought; idea","-다고 생각해요 reports what you think; 써 보다 means to try using something."],
    ["thinking-time","아직 잘 모르겠어요. 조금 더 생각해 보고 이야기할게요.","I am not sure yet. I will think a little more and then talk about it.","의견","opinion","아직 marks not yet. -아/어 보고 links trying something with the later response promised by -(으)ㄹ게요."],
  ]},
];

export const learningPhrases = chapters.flatMap(chapter=>chapter.lines.map(([id,korean,meaning,focus,focusMeaning,tip])=>({
  id,lessonId:chapter.id,topic:chapter.title,level:chapter.level,korean,meaning,focus,focusMeaning,tip,
})));

export const phraseLessons: Lesson[] = chapters.map(chapter=>({
  id:chapter.id,title:chapter.title,detail:"Four useful phrases, then recall them in context",category:"Conversation",minutes:8,
  level:chapter.level,pathwayId:chapter.level==="stretch"?"stretch":chapter.id==="phrase-family"?"connections":"everyday",
  prerequisiteLessonIds:[chapter.prerequisite],words:[...new Set(chapter.lines.map(line=>line[3]))],authoredOnly:true,
  briefing:{focus:chapter.focus,explanation:chapter.lines[0][5],useWhen:"Listen, connect each phrase with its situation, then recall the Korean. These are example wordings, not the only valid responses.",example:chapter.lines[0][1],translation:chapter.lines[0][2]},
  questions:[
    ...chapter.lines.map(([id,korean,meaning,,,tip])=>({id:`phrase-${id}-meaning`,type:"choice" as const,korean,prompt:"What does this phrase mean in this situation?",choices:[meaning,...chapter.lines.filter(line=>line[2]!==meaning).slice(0,2).map(line=>line[2])],answer:meaning,tip})),
    ...chapter.lines.slice(2).map(([id,korean,meaning,,,tip])=>({id:`phrase-${id}-recall`,type:"text" as const,korean,prompt:`Recall the example wording: ${meaning}`,answer:korean,accepted:[],placeholder:"Your Korean phrase",tip})),
  ],
}));
