import type {Metadata} from 'next';
import {WeeklyCheckpoint} from '../ui/weekly-checkpoint';
import {lessons} from '../curriculum';
export const metadata:Metadata={title:'Weekly checkpoint preview — Saegim',robots:{index:false,follow:false}};
export default function CheckpointPreview(){return <main className="checkpoint-preview"><a href="/">← Back to Saegim</a><h1>Try the weekly checkpoint</h1><p>Demo only: three sample lessons are treated as completed. Your account, progress, and review schedule are untouched. Answers stay in this page and reset when you reload.</p><WeeklyCheckpoint completed={lessons.slice(0,3).map(lesson=>lesson.id)}/></main>}
