"use client";
import { useState } from "react";
import { journeyTopics, journeyVocabulary } from "../journey-content";
import { WordReference } from "./word-reference";
import { playElevenLabsKorean, selectedElevenLabsVoice } from "./speech";
export function WordPacks() {
  const [topic, setTopic] = useState<string | null>(null),
    [busy, setBusy] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const pack = journeyTopics.find((item) => item.id === topic);
  return (
    <section
      className="journey-word-packs"
      aria-label="Themed vocabulary packs"
    >
      <span className="micro-label">48 GUIDED WORDS · 8 EVERYDAY TOPICS</span>
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
            onClick={() => setTopic(topic === item.id ? null : item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
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
                    setBusy(word.id);
                    setNotice("");
                    try {
                      const audio = await playElevenLabsKorean(
                        word.example,
                        selectedElevenLabsVoice(),
                        1,
                        { naturalOnly: true },
                      );
                      if (!audio.played)
                        setNotice(
                          "Audio is unavailable right now. You can keep exploring.",
                        );
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {busy === word.id
                    ? "Preparing voice…"
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
