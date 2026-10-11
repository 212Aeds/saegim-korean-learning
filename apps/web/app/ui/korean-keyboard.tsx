"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { editKorean } from "./korean-input";

const rows = ["ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ", "ㅁㄴㅇㄹㅎㅗㅓㅏㅣ", "ㅋㅌㅊㅍㅠㅜㅡ", "ㄲㄸㅃㅆㅉㅒㅖ"];
export function KoreanInput({ value, onChange, label, placeholder, onKeyDown }: {
  value: string; onChange: (value: string) => void; label: string; placeholder?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  function enter(key: string) {
    const element = input.current;
    const result = editKorean(value, element?.selectionStart ?? value.length, element?.selectionEnd ?? value.length, key);
    onChange(result.value);
    requestAnimationFrame(() => { element?.focus(); element?.setSelectionRange(result.cursor, result.cursor); });
  }
  return <div className="korean-input">
    <input ref={input} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown}
      onFocus={() => setOpen(true)} aria-label={label} placeholder={placeholder} autoComplete="off" autoCapitalize="none" />
    <button type="button" className="keyboard-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} Korean keyboard</button>
    {open && <div className="korean-keyboard" role="group" aria-label="Korean keyboard">
      {rows.map((row) => <div className="keyboard-row" key={row}>{[...row].map((key) => <button type="button" key={key} onMouseDown={(event) => event.preventDefault()} onClick={() => enter(key)} aria-label={`Type ${key}`}>{key}</button>)}</div>)}
      <div className="keyboard-row"><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => enter("space")}>Space</button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => enter("backspace")} aria-label="Delete last Korean letter">⌫</button></div>
      <small>Consonant + vowel builds a syllable: ㄴ + ㅓ → 너</small>
    </div>}
  </div>;
}
