"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import type { ComplexPin } from "./MapView";

function priceIcon(pin: ComplexPin, active: boolean) {
  const label = pin.count > 1 ? `$${pin.minRent}+ · ${pin.count}` : `$${pin.minRent}`;
  return L.divIcon({ className: "", html: `<span class="price-pin${active ? " active" : ""}">${label}</span>`, iconSize: [0, 0] });
}

const campusIcon = L.divIcon({ className: "", html: `<span class="campus-pin">BYU</span>`, iconSize: [0, 0] });

export default function LeafletMap({
  pins,
  campus,
  selected,
  onSelect,
}: {
  pins: ComplexPin[];
  campus: { lat: number; lng: number };
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <MapContainer center={[campus.lat - 0.004, campus.lng - 0.005]} zoom={15} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
      />
      <Marker position={[campus.lat, campus.lng]} icon={campusIcon} interactive={false} />
      {pins.map((p) => (
        <Marker
          key={p.complexId}
          position={[p.lat, p.lng]}
          icon={priceIcon(p, p.complexId === selected)}
          zIndexOffset={p.complexId === selected ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.complexId === selected ? null : p.complexId) }}
        >
          <Tooltip direction="top" offset={[0, -12]}>{p.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
