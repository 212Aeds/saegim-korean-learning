"use client";

import { useId, useRef, useState } from "react";
import type { SpeakingCard } from "../speak-cards";
import { phrasePage, phraseTopics } from "../phrase-browser";
import { ArrowLeft, ArrowRight, Check } from "./icons";

export function PhrasePicker({cards,current,completedIds,disabled,onChoose}:{cards:SpeakingCard[];current:SpeakingCard;completedIds:string[];disabled:boolean;onChoose:(id:string)=>void}) {
  const [open,setOpen]=useState(false),[topic,setTopic]=useState(""),[query,setQuery]=useState(""),[page,setPage]=useState(0);
  const id=useId(),trigger=useRef<HTMLButtonElement>(null),searchInput=useRef<HTMLInputElement>(null);
  const results=phrasePage(cards,topic,query,page),topics=phraseTopics(cards);
  const noun=current.kind==="pronunciation"?"letters":current.kind==="word"?"words":"phrases";
  function close(){setOpen(false);trigger.current?.focus();}
  return <section className="phrase-browser" aria-label={`Choose practice ${noun}`}>
    <button type="button" ref={trigger} className="phrase-browser-trigger" aria-expanded={open} aria-controls={id} disabled={disabled} onClick={()=>setOpen(value=>!value)}>
      <span><strong>Browse {noun}</strong><small>{cards.length} for your level · {current.promptLabel}</small></span>
      <span aria-hidden="true">{open?"−":"+"}</span>
    </button>
    {open&&<div id={id} className="phrase-browser-panel" onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();close();}}}>
      <div className="phrase-browser-filters">
        <label>Topic<select value={topic} onChange={event=>{setTopic(event.target.value);setPage(0);}}><option value="">All topics</option>{topics.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Find a {noun==="phrases"?"phrase":noun==="letters"?"letter":"word"}<input ref={searchInput} type="search" value={query} placeholder="Korean, English, or romanization" onChange={event=>{setQuery(event.target.value);setPage(0);}} /></label>
      </div>
      <p className="phrase-browser-status" role="status">{results.total?`${results.page*6+1}–${Math.min(results.total,(results.page+1)*6)} of ${results.total}`:"No matches. Try another word or topic."}</p>
      <ul className="phrase-browser-results">
        {results.cards.map(card=><li key={card.id}><button type="button" aria-current={current.id===card.id?"true":undefined} onClick={()=>{onChoose(card.id);close();}}>
          <span><strong lang="ko">{card.korean}</strong><span>{card.meaning}</span></span>
          {completedIds.includes(card.id)?<Check size={18} aria-label="Practiced"/>:<ArrowRight size={18} aria-hidden="true"/>}
        </button></li>)}
      </ul>
      <div className="phrase-browser-footer">
        {(topic||query)&&<button type="button" className="button button-quiet" onClick={()=>{setTopic("");setQuery("");setPage(0);searchInput.current?.focus();}}>Clear filters</button>}
        {results.pages>1&&<nav aria-label="Phrase pages"><button type="button" className="speak-arrow" aria-label="Previous phrase page" disabled={results.page===0} onClick={()=>setPage(results.page-1)}><ArrowLeft size={18}/></button><span>{results.page+1} / {results.pages}</span><button type="button" className="speak-arrow" aria-label="Next phrase page" disabled={results.page===results.pages-1} onClick={()=>setPage(results.page+1)}><ArrowRight size={18}/></button></nav>}
      </div>
    </div>}
  </section>;
}
