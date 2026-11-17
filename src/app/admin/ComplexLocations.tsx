"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { moveComplex } from "@/lib/actions/admin";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

type C = { id: number; name: string; lat: number; lng: number; location_verified: number };

export function ComplexLocations({ complexes }: { complexes: C[] }) {
  const [selected, setSelected] = useState<C | null>(complexes[0] ?? null);
  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <ul className="card max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {complexes.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => setSelected(c)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${selected?.id === c.id ? "bg-brand-50 font-semibold" : ""}`}
            >
              {c.name}
              <span className={`h-2.5 w-2.5 rounded-full ${c.location_verified ? "bg-brand-500" : "bg-amber-400"}`} />
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <LocationPicker
          key={selected.id}
          height="h-96"
          center={{ lat: selected.lat, lng: selected.lng }}
          value={{ lat: selected.lat, lng: selected.lng }}
          onChange={(p) => {
            setSelected({ ...selected, ...p, location_verified: 1 });
            void moveComplex(selected.id, p.lat, p.lng);
          }}
        />
      )}
    </div>
  );
}
