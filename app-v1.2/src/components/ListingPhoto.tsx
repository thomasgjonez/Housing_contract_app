// A listing's first photo, or a colored placeholder with the complex name.
const COLORS = ["from-sky-400 to-indigo-500", "from-emerald-400 to-teal-600", "from-amber-400 to-orange-500", "from-fuchsia-400 to-purple-600", "from-rose-400 to-red-500"];

export function ListingPhoto({ photo, complex, id, className = "" }: { photo: string | null; complex: string; id: number; className?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/photos/${photo}`} alt={complex} className={`object-cover ${className}`} draggable={false} />;
  }
  return (
    <div className={`grid place-items-center bg-gradient-to-br ${COLORS[id % COLORS.length]} ${className}`}>
      <span className="px-4 text-center text-2xl font-extrabold text-white/90 drop-shadow">{complex}</span>
    </div>
  );
}
