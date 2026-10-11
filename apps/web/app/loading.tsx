import { SoriMascot } from "./ui/sori-mascot";

export default function Loading() {
  return (
    <main className="route-loading" aria-live="polite" aria-busy="true">
      <SoriMascot className="loading-mascot" />
      <strong>One moment</strong>
      <span>Getting your Korean practice ready…</span>
      <div className="loading-track" aria-hidden="true"><i /></div>
    </main>
  );
}
