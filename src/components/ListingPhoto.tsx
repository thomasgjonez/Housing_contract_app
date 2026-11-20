// A listing's first photo, or a mountain-scene placeholder with the complex name.
const SCENES = [
  { sky: "#7fa796", ridge: "#5e8a78" },
  { sky: "#8fb3c9", ridge: "#6a93ad" },
  { sky: "#e8a68b", ridge: "#cf8467" },
  { sky: "#a9b98f", ridge: "#899c6c" },
  { sky: "#9aa8c7", ridge: "#7786ab" },
];

export function ListingPhoto({ photo, complex, id, className = "" }: { photo: string | null; complex: string; id: number; className?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={complex} className={`object-cover ${className}`} draggable={false} />;
  }
  const s = SCENES[id % SCENES.length];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: s.sky }}>
      <svg aria-hidden="true" viewBox="0 0 370 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[55%] w-full">
        <path d="M0 120 L0 70 L60 30 L110 60 L180 10 L240 55 L300 25 L370 70 L370 120 Z" fill={s.ridge} />
      </svg>
      <span className="absolute bottom-3 left-4 right-4 font-display text-xl font-semibold text-white drop-shadow-sm">{complex}</span>
    </div>
  );
}
