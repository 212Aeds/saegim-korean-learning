"use client";
import { useEffect, useRef, useState } from "react";
import { journeyTopics, journeyVocabulary } from "../journey-content";
import { WordReference } from "./word-reference";
import { playElevenLabsKorean, selectedElevenLabsVoice, preferredSpeechRate, stopKoreanPlayback } from "./speech";
export function WordPacks() {
  const [topic, setTopic] = useState<string | null>(null),
    [busy, setBusy] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const pack = journeyTopics.find((item) => item.id === topic);
  const attempt=useRef(0);
  function stopAudio(){attempt.current++;stopKoreanPlayback();setBusy(null);}
  useEffect(()=>()=>{attempt.current++;stopKoreanPlayback();},[]);
  return (
    <section
      className="journey-word-packs"
      aria-label="Themed vocabulary packs"
    >
      <span className="micro-label">{journeyVocabulary.length} GUIDED WORDS · {journeyTopics.length} TOPICS</span>
      <h3>Meet words you can use together.</h3>
      <p>
        Choose a topic for contextual meanings and examples. Explore freely;
        lessons and review keep their own progress.
      </p>
      <div className="word-topic-buttons">
        {journeyTopics.map((item) => (
          <button
            className="button button-soft"
            key={item.id}
            aria-pressed={topic === item.id}
            onClick={() => {stopAudio();setTopic(topic === item.id ? null : item.id);setNotice("");}}
          >
            {item.title}
          </button>
        ))}
      </div>
      {busy && <button type="button" className="button button-quiet" onClick={stopAudio}>Stop audio</button>}
      {pack && (
        <div className="word-pack-grid">
          {journeyVocabulary
            .filter((word) => word.id.startsWith(`journey-${pack.id}-`))
            .map((word) => (
              <article key={word.id}>
                <h4 lang="ko">{word.korean}</h4>
                <span>{word.romanization}</span>
                <strong>{word.meaning}</strong>
                <p lang="ko">{word.example}</p>
                <small>{word.exampleTranslation}</small>
                <button
                  className="button button-quiet"
                  disabled={!!busy}
                  onClick={async () => {
                    const version=++attempt.current;
                    setBusy(word.id);
                    setNotice("");
                    try {
                      const audio = await playElevenLabsKorean(
                        word.example,
                        selectedElevenLabsVoice(),
                        preferredSpeechRate(),
                        { naturalOnly: true, waitForEnd:true },
                      );
                      if (!audio.played && version===attempt.current)
                        setNotice(
                          "Audio is unavailable right now. You can keep exploring.",
                        );
                    } finally {
                      if(version===attempt.current)setBusy(null);
                    }
                  }}
                >
                  {busy === word.id
                    ? "Preparing / playing…"
                    : "Listen to the example"}
                </button>
                <WordReference
                  word={word.korean}
                  source={word.source}
                  license={word.license}
                  reviewStatus={word.reviewStatus}
                />
              </article>
            ))}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
