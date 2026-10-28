"use client";
// Front end: a small OpenStreetMap map with the skull pin. Loaded in the browser only (Leaflet needs `window`).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

// map-pin.png is 1713×918 with a clear border; at 112×60 the pin's tip sits at about (56, 59)
const PIN = L.icon({ iconUrl: "/images/map-pin.png", iconSize: [112, 60], iconAnchor: [56, 59] });

export default function TourMap({ lat, lon, place }: { lat: number; lon: number; place: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!box.current) return;
    // Scrolling the page past the map shouldn't zoom it (+ / − and double-click still zoom).
    // On phones, one finger scrolls the page instead of dragging the map; pinch still zooms.
    const map = L.map(box.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile }).setView([lat, lon], 15); // centered on the grave

    // Free OpenStreetMap tiles; the attribution is required by OSM
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([lat, lon], { icon: PIN, alt: `Map pin for ${place}` }).addTo(map);

    return () => {
      map.remove(); // clean up so switching legends never stacks two maps in one box
    };
  }, [lat, lon, place]);

  return <div ref={box} className="mt-3 h-60 w-full overflow-hidden rounded" />;
}
