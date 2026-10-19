const fs=require('node:fs'),ts=require('typescript'),{test}=require('node:test'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
const {studyReminder}=require('../apps/web/app/ui/study-reminder.ts');
test('optional reminder uses a future local time, finite recurrence and display-only alerts',()=>{
 const now=new Date(2026,11,31,20,0),value=studyReminder('19:00','daily',now,'synthetic-id');
 assert.match(value,/DTSTART:20270101T190000\r\n/);assert.match(value,/RRULE:FREQ=DAILY;COUNT=14/);assert.match(value,/ACTION:DISPLAY/);assert.match(value,/TRIGGER:PT0M/);assert.match(value,/TRANSP:TRANSPARENT/);assert.doesNotMatch(value,/ATTENDEE|ORGANIZER|ACTION:EMAIL|mailto:|TZID=/);assert.ok(value.endsWith('END:VCALENDAR\r\n'));assert.equal(value.replace(/\r\n/g,'').includes('\n'),false);
 const weekly=studyReminder('21:30','weekly',now,'weekly');assert.match(weekly,/DTSTART:20261231T213000/);assert.match(weekly,/RRULE:FREQ=WEEKLY;COUNT=8/);
});
test('reminder rejects invalid times and calendar injection',()=>{for(const time of ['24:00','19:60','7:00','19:00\nATTENDEE:x'])assert.throws(()=>studyReminder(time,'daily',new Date(),'id'));assert.throws(()=>studyReminder('19:00','forever',new Date(),'id'));assert.throws(()=>studyReminder('19:00','daily',new Date(),'x\nACTION:EMAIL'));assert.throws(()=>studyReminder('19:00','daily',new Date('invalid'),'id'));});
