// "6 min walk" drawn as a little route from the complex to campus.
export function WalkLine({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-slate-700">
      <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
      <span className="flex-1 border-t-2 border-dotted border-brand-200" />
      <span className="shrink-0">{minutes} min walk</span>
      <span className="flex-1 border-t-2 border-dotted border-brand-200" />
      <span className="shrink-0 font-semibold text-brand-600">BYU</span>
    </div>
  );
}
