export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80 ? "bg-emerald-600 text-white" : score >= 60 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>{score}% match</span>;
}
