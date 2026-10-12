"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { editKorean } from "./korean-input";

const rows = ["ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ", "ㅁㄴㅇㄹㅎㅗㅓㅏㅣ", "ㅋㅌㅊㅍㅠㅜㅡ", "ㄲㄸㅃㅆㅉㅒㅖ"];
export function KoreanInput({ value, onChange, label, placeholder, onKeyDown, multiline = false, openOnFocus = true, maxLength, disabled = false }: {
  value: string; onChange: (value: string) => void; label: string; placeholder?: string;
  disabled?: boolean;
  multiline?: boolean; openOnFocus?: boolean; maxLength?: number;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const input = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (multiline && input.current) { input.current.style.height = "auto"; input.current.style.height = `${Math.min(180, input.current.scrollHeight)}px`; }
  }, [value, multiline]);
  function enter(key: string) {
    const element = input.current;
    const result = editKorean(value, element?.selectionStart ?? value.length, element?.selectionEnd ?? value.length, key);
    onChange(result.value);
    requestAnimationFrame(() => { element?.focus(); element?.setSelectionRange(result.cursor, result.cursor); });
  }
  return <div className="korean-input">
    {multiline ? <textarea ref={(element) => { input.current = element; }} rows={3} disabled={disabled} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown}
      onFocus={() => { if (openOnFocus) setOpen(true); }} aria-label={label} placeholder={placeholder} autoComplete="off" />
      : <input ref={(element) => { input.current = element; }} disabled={disabled} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown}
      onFocus={() => { if (openOnFocus) setOpen(true); }} aria-label={label} placeholder={placeholder} autoComplete="off" autoCapitalize="none" />}
    <button type="button" className="keyboard-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} Korean keyboard</button>
    {open && <div className="korean-keyboard" role="group" aria-label="Korean keyboard">
      {rows.map((row) => <div className="keyboard-row" key={row}>{[...row].map((key) => <button type="button" key={key} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => enter(key)} aria-label={`Type ${key}`}>{key}</button>)}</div>)}
      <div className="keyboard-row"><button type="button" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => enter("space")}>Space</button><button type="button" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => enter("backspace")} aria-label="Delete last Korean letter">⌫</button></div>
      <small>Consonant + vowel builds a syllable: ㄴ + ㅓ → 너</small>
    </div>}
  </div>;
}
