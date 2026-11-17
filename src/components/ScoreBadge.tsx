export function ScoreBadge({ score, onPhoto = false }: { score: number; onPhoto?: boolean }) {
  const tone = onPhoto
    ? "bg-white text-brand-600 shadow-sm"
    : score >= 80
      ? "bg-brand-600 text-white"
      : score >= 60
        ? "bg-brand-100 text-brand-700"
        : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{score}% match</span>;
}
