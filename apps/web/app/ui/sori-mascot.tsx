export function SoriMascot({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 112 112" role="img" aria-label="Sori, a little sound-sprout mascot">
      <path d="M56 11c-6 12-6 20 0 26 6-6 7-14 0-26Z" fill="#6e8b67" />
      <path d="M54 27c-12-12-25-8-27-1 5 11 16 15 27 9M59 27c12-12 25-8 27-1-5 11-16 15-27 9" fill="#92a983" />
      <path d="M56 30c-16 0-29 10-29 27v21c0 13 13 22 29 22s29-9 29-22V57C85 40 72 30 56 30Z" fill="#f8f3e8" stroke="#385442" strokeWidth="3" />
      <path d="M40 60c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5Zm22 0c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5Z" fill="#314739" />
      <path d="M50 73c3 4 9 4 12 0" fill="none" stroke="#c66d58" strokeLinecap="round" strokeWidth="3" />
      <path d="M15 54c-6 4-6 13 0 17m82-17c6 4 6 13 0 17" fill="none" stroke="#c66d58" strokeLinecap="round" strokeWidth="3" />
      <circle cx="35" cy="72" r="4" fill="#df927d" opacity=".7" />
      <circle cx="77" cy="72" r="4" fill="#df927d" opacity=".7" />
      <path d="M50 100v6m12-6v6" stroke="#385442" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
