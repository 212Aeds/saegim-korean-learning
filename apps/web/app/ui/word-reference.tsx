import index from "../word-reference-index.json";
export function WordReference({ word, source, license, reviewStatus, readingSample = false }: { word: string; source?: string; license?: string; reviewStatus?: string; readingSample?: boolean }) {
  const isLetter = /^[ㄱ-ㅎㅏ-ㅣ]$/u.test(word);
  const dictionary = `https://krdict.korean.go.kr/eng/dicMarinerSearch/search?mainSearchWord=${encodeURIComponent(word)}`;
  const line = (index.lines as Record<string, number>)[word];
  const corpusLink = `https://github.com/mhagiwara/cc-kedict/blob/${index.revision}/kedict.yml${line ? `#L${line}` : ""}`;
  return <details className="word-reference"><summary>References for <span lang="ko">{word}</span></summary>
    <a href={readingSample ? "https://www.korean.go.kr/eng_hangeul/principle/001.html" : isLetter ? "https://www.korean.go.kr/front_eng/roman/roman_01.do" : dictionary} target="_blank" rel="noopener noreferrer">{readingSample ? "NIKL: letter and syllable structure" : isLetter ? "NIKL: Hangul and romanization" : "NIKL Korean-English dictionary lookup"} ↗</a>
    {isLetter && <a href="https://korean.go.kr/front/mcfaq/mcfaqView.do?mcfaq_seq=5573" target="_blank" rel="noopener noreferrer">NIKL: official letter names ↗</a>}
    {readingSample && <small>App-authored reading drill. A syllable sample has no claimed vocabulary meaning.</small>}
    {!readingSample && (line || source === "cc-kedict") && <><a href={corpusLink} target="_blank" rel="noopener noreferrer">{source === "cc-kedict" ? "Definition source" : "Dictionary entry"}: cc-kedict {line ? `· line ${line}` : "corpus"} ↗</a><small>Michael Hagiwara and contributors · {license ?? "CC BY-SA 3.0"}. The corpus can contain several senses for one headword; app examples and categories are adaptations.</small></>}
    {!readingSample && source !== "cc-kedict" && <small>Teaching examples and prompts are app-authored. Dictionary lookup is provided for comparison; a lookup link is not an editorial verification.</small>}
    <small>{reviewStatus === "editor_reviewed" ? "Editorial check: completed." : "Editorial check: pending. Definitions and app-authored examples should be checked in context."}</small>
  </details>;
}
