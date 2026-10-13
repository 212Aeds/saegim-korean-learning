import type { LearningProfile } from "../learning-profile";

export const conversationGuides = {
  new: { title: "First little exchanges", detail: "A greeting or a single word is enough. Your partner keeps each turn short.", goal: "Try a greeting, give your name, and ask for help when you need it.", turns: 3,
    starters: ["Help me practice a greeting, one short question at a time.", "Help me say my name in very simple Korean.", "Teach me to ask for water, one word at a time."] },
  hangul: { title: "From letters to phrases", detail: "Read familiar words, then try a short polite reply.", goal: "Introduce yourself, make one request, and answer a short question.", turns: 4,
    starters: ["Let’s introduce ourselves with short polite phrases.", "Help me order one drink with familiar words.", "Practice asking where the station is in simple Korean."] },
  basic: { title: "Everyday confidence", detail: "Build complete sentences for familiar situations.", goal: "Make a request, answer a follow-up, and ask a question of your own.", turns: 4,
    starters: ["Let’s order lunch and ask one follow-up question.", "Ask me about yesterday using simple polite Korean.", "Help me explain where I want to go."] },
  intermediate: { title: "Keep the exchange going", detail: "Connect a thought with a reason or a past experience.", goal: "Share an experience, explain a reason, and respond to your partner’s idea.", turns: 5,
    starters: ["Let’s compare two weekend plans and explain our reasons.", "Ask me about a memorable trip and follow up naturally.", "Let’s talk about my hobbies using connected sentences."] },
  advanced: { title: "Ideas worth discussing", detail: "Explore opinions, choices, and nuance in natural Korean.", goal: "State an opinion, support it, and consider another point of view.", turns: 5,
    starters: ["Let’s discuss how travel changes our perspective.", "Let’s compare studying alone with studying together.", "Ask me about a difficult choice and explore my reasons."] },
} satisfies Record<LearningProfile["level"], { title: string; detail: string; goal: string; turns: number; starters: string[] }>;

export const conversationSituations = [
  { id: "everyday", title: "Everyday life", prompt: "Let’s talk about everyday life at my level.", phrase: "다시 말해 주세요.", meaning: "Please say it again." },
  { id: "cafe", title: "At a café", prompt: "You are the café staff. Help me order a drink at my level.", phrase: "물을 마셔요.", meaning: "I drink water." },
  { id: "travel", title: "Finding your way", prompt: "Let’s practice asking for directions at my level.", phrase: "역이 어디예요?", meaning: "Where is the station?" },
  { id: "friends", title: "Meeting a friend", prompt: "Let’s meet as friends and talk about our hobbies at my level.", phrase: "취미가 뭐예요?", meaning: "What is your hobby?" },
  { id:"home",title:"At home",prompt:"Let's describe our home and daily routine at my level.",phrase:"집에 가요.",meaning:"I go home." },
  { id:"stay",title:"Checking in",prompt:"Help me practice arriving at a hotel and asking for a key at my level.",phrase:"예약이 있어요.",meaning:"I have a reservation." },
  { id:"messages",title:"Staying in touch",prompt:"Let's practice sending a message and exchanging contact details at my level. Use fictional details.",phrase:"메시지를 보내요.",meaning:"I send a message." },
  { id:"plans",title:"Making plans",prompt:"Let's arrange a time and place to meet at my level.",phrase:"약속이 있어요.",meaning:"I have an appointment." },
] as const;
