"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ListingCard, type CardListing } from "@/components/ListingCard";

export type MapListing = CardListing & { complex_id: number; lat: number; lng: number };

export type ComplexPin = { complexId: number; name: string; lat: number; lng: number; minRent: number; count: number };

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Loading map…</div>,
});

export function MapView({ listings, campus }: { listings: MapListing[]; campus: { lat: number; lng: number } }) {
  const [selected, setSelected] = useState<number | null>(null);

  // One pin per complex, labelled with its cheapest listing.
  const pins = useMemo(() => {
    const byComplex = new Map<number, ComplexPin>();
    for (const l of listings) {
      const p = byComplex.get(l.complex_id);
      if (p) {
        p.count++;
        p.minRent = Math.min(p.minRent, l.rent_monthly);
      } else {
        byComplex.set(l.complex_id, { complexId: l.complex_id, name: l.complex, lat: l.lat, lng: l.lng, minRent: l.rent_monthly, count: 1 });
      }
    }
    return [...byComplex.values()];
  }, [listings]);

  const shown = selected ? listings.filter((l) => l.complex_id === selected) : listings;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="card h-[60vh] overflow-hidden lg:h-[calc(100vh-11rem)]">
        <LeafletMap pins={pins} campus={campus} selected={selected} onSelect={setSelected} />
      </div>
      <div className="space-y-3 lg:h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{selected ? pins.find((p) => p.complexId === selected)?.name : "All listings"}</span>
          {selected && <button className="text-sm font-semibold text-brand-600" onClick={() => setSelected(null)}>Show all</button>}
        </div>
        {shown.length === 0 && <div className="card p-6 text-center text-sm text-slate-600">No listings match these filters.</div>}
        {shown.map((l) => <ListingCard key={l.id} l={l} />)}
      </div>
    </div>
  );
}
