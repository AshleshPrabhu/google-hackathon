import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./loadGoogleMaps";

declare global {
  interface Window {
    google: any;
  }
}

interface HeatmapPoint {
  location: { lat: number; lng: number };
  weight: number;
  type?: "lost" | "found";
}

interface Props {
  points: HeatmapPoint[];
}

export default function HeatmapView({ points }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!mapRef.current) return;

      await loadGoogleMaps();
      if (!mounted) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 13.0105, lng: 74.794 },
        zoom: 16,
        mapTypeId: "roadmap",
        styles: [{ elementType: "geometry", stylers: [{ color: "#0f172a" }] }],
      });

      mapInstance.current = map;

      points.forEach((p) => {
        const color =
          p.type === "found"
            ? "#22c55e"
            : p.type === "lost"
            ? "#ef4444"
            : "#3b82f6";

        new window.google.maps.Circle({
          map,
          center: p.location,
          radius: p.weight * 25,
          fillColor: color,
          fillOpacity: 0.35,
          strokeOpacity: 0,
        });
      });

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [points]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800 text-gray-300">
          Loading map...
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full"
      />
    </div>
  );
}
