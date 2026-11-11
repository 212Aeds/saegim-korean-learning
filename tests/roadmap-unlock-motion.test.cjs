const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('roadmap celebrates an earned unlock, not initial placement or a level change',()=>{
 const exports={},effects=[],timers=[];let state=[],ref={current:null};
 const route=[{id:'first',title:'First',detail:'Start'},{id:'second',title:'Second',detail:'Next'}];
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/learning-roadmap.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,window:{setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){}},require(id){
  if(id==='react')return {useRef:()=>ref,useState:()=>[state,v=>state=v],useEffect:fn=>effects.push(fn)};
  if(id==='react/jsx-runtime')return require(id);
  if(id==='../learning-profile')return {learningRoute:()=>route,placementKnowledge:()=>[]};
  if(id==='../learning-pathways')return {isLessonUnlocked:(lesson,completed)=>lesson.id==='first'||completed.includes('first')};
  throw Error(id);
 }});
 const profile={level:'new'},render=(completed,p=profile)=>exports.LearningRoadmap({profile:p,completed,onLesson(){}});
 render([]);effects.shift()();assert.deepEqual([...state],[],'initially available lessons are not newly unlocked');
 render(['first']);effects.shift()();assert.deepEqual([...state],['second']);
 timers.at(-1)();assert.deepEqual([...state],[],'celebration clears without changing completion');
 render(['first'],{level:'basic'});effects.shift()();assert.deepEqual([...state],[],'placement changes do not count as earned unlocks');
});
