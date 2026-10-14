import { recommendedLessons, type LearningProfile } from "../learning-profile";
import { accountAvatar, avatars } from "../account-personalization";

const levelNames = {new:"A fresh beginning",hangul:"From letters to words",basic:"Useful words, one at a time",intermediate:"Everyday conversations",advanced:"Ideas and natural exchanges"};
const reasonNames = {family:"family",travel:"travel",culture:"music and shows","work-study":"work and study",friends:"friendships",food:"food",living:"life in Korea",exams:"study goals"};
export function ProfilePreview({name,profile,completed=[]}: {name:string;profile:LearningProfile;completed?:string[]}) {
  const next = recommendedLessons(completed,profile)[0];
  return <section className="profile-preview" aria-label="Your personalized learning plan">
    <span className="profile-preview-avatar" aria-hidden="true">{accountAvatar(profile)}</span>
    <div><span className="micro-label">{name.trim() || "YOUR"}’S KOREAN JOURNEY</span><h3>{levelNames[profile.level]}</h3>
    <p>{profile.dailyMinutes ?? 15} minutes a day · {profile.weeklyGoal ?? 5} days a week</p>
    <p>{profile.reasons.length ? `Made room for ${profile.reasons.map(reason=>reasonNames[reason]).join(", ")}.` : "Choose what brings you to Korean."}</p>
    {next && <small>Next step: <strong>{next.title}</strong></small>}</div>
  </section>;
}
export function AvatarChoices({profile,onChange}: {profile:LearningProfile;onChange:(profile:LearningProfile)=>void}) {
  return <fieldset className="learning-profile-fields"><legend>A little personality</legend><span>Choose your study companion</span><div className="avatar-choices">{Object.entries(avatars).map(([id,symbol])=><button key={id} type="button" aria-label={`Choose ${id} avatar`} aria-pressed={(profile.avatar ?? "sprout")===id} onClick={()=>onChange({...profile,avatar:id as NonNullable<LearningProfile["avatar"]>})}>{symbol}</button>)}</div></fieldset>;
}
