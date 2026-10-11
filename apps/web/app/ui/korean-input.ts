import * as Hangul from "hangul-js";

export function editKorean(value: string, start: number, end: number, key: string) {
  let before = value.slice(0, start);
  const after = value.slice(end);
  if (key === "backspace") {
    if (start === end && before) {
      const parts = Hangul.disassemble(before.slice(-1));
      parts.pop();
      before = before.slice(0, -1) + Hangul.assemble(parts);
    }
  } else if (key === "space") before += " ";
  else {
    const last = before.slice(-1);
    before = /[ㄱ-ㅎㅏ-ㅣ가-힣]/u.test(last)
      ? before.slice(0, -1) + Hangul.assemble([...Hangul.disassemble(last), key])
      : before + key;
  }
  return { value: before + after, cursor: before.length };
}
