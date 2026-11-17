"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

const dot = L.divIcon({ className: "", html: `<span class="price-pin active">Here</span>`, iconSize: [0, 0] });

function ClickHandler({ onChange }: { onChange: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// A small map; clicking it sets the location.
export default function LocationPicker({
  center,
  value,
  onChange,
  height = "h-56",
}: {
  center: { lat: number; lng: number };
  value: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
  height?: string;
}) {
  return (
    <div className={`${height} overflow-hidden rounded-2xl`}>
      <MapContainer center={value ? [value.lat, value.lng] : [center.lat, center.lng]} zoom={15} className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <ClickHandler onChange={onChange} />
        {value && <Marker position={[value.lat, value.lng]} icon={dot} />}
      </MapContainer>
    </div>
  );
}
