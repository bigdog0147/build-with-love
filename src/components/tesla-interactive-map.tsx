import { useState, useRef } from "react";
import {
  Locate,
  MessageSquare,
  Car,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Layers,
  Compass,
  Map as MapIcon,
  Globe,
} from "lucide-react";
import { X3Logo3D } from "@/components/x3-logo-3d";

interface Pin {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  city: string;
  state: string;
  stalls: number;
  type: "supercharger" | "service";
}

const NETWORK_PINS: Pin[] = [
  // West Coast
  { x: 12, y: 28, city: "Seattle", state: "Washington", stalls: 32, type: "supercharger" },
  { x: 13, y: 35, city: "Portland", state: "Oregon", stalls: 24, type: "supercharger" },
  { x: 10, y: 52, city: "San Francisco Giga", state: "California", stalls: 48, type: "service" },
  { x: 12, y: 62, city: "Los Angeles", state: "California", stalls: 56, type: "supercharger" },
  { x: 14, y: 67, city: "San Diego", state: "California", stalls: 28, type: "supercharger" },
  // Mountain / Southwest
  { x: 17, y: 44, city: "Salt Lake City", state: "Utah", stalls: 20, type: "supercharger" },
  { x: 16, y: 52, city: "Giga Nevada / Sparks", state: "Nevada", stalls: 40, type: "service" },
  { x: 19, y: 56, city: "Las Vegas", state: "Nevada", stalls: 36, type: "supercharger" },
  { x: 21, y: 66, city: "Phoenix", state: "Arizona", stalls: 32, type: "supercharger" },
  { x: 26, y: 62, city: "Albuquerque", state: "New Mexico", stalls: 16, type: "supercharger" },
  { x: 27, y: 48, city: "Denver", state: "Colorado", stalls: 28, type: "supercharger" },
  // Central & Texas
  { x: 37, y: 68, city: "Dallas / Fort Worth", state: "Texas", stalls: 44, type: "supercharger" },
  { x: 37, y: 75, city: "Austin Giga Campus", state: "Texas", stalls: 64, type: "service" },
  { x: 40, y: 77, city: "Houston", state: "Texas", stalls: 36, type: "supercharger" },
  { x: 35, y: 79, city: "San Antonio", state: "Texas", stalls: 24, type: "supercharger" },
  { x: 38, y: 46, city: "Omaha", state: "Nebraska", stalls: 16, type: "supercharger" },
  { x: 41, y: 50, city: "Kansas City", state: "Missouri", stalls: 24, type: "supercharger" },
  { x: 42, y: 34, city: "Minneapolis", state: "Minnesota", stalls: 24, type: "supercharger" },
  { x: 46, y: 52, city: "St. Louis", state: "Missouri", stalls: 20, type: "supercharger" },
  // Midwest & Great Lakes
  { x: 50, y: 42, city: "Chicago Hub", state: "Illinois", stalls: 48, type: "service" },
  { x: 51, y: 39, city: "Milwaukee", state: "Wisconsin", stalls: 20, type: "supercharger" },
  { x: 55, y: 42, city: "Detroit", state: "Michigan", stalls: 32, type: "supercharger" },
  { x: 53, y: 49, city: "Indianapolis", state: "Indiana", stalls: 20, type: "supercharger" },
  { x: 58, y: 46, city: "Cleveland / Columbus", state: "Ohio", stalls: 28, type: "supercharger" },
  // South
  { x: 52, y: 59, city: "Nashville", state: "Tennessee", stalls: 24, type: "supercharger" },
  { x: 56, y: 68, city: "Atlanta", state: "Georgia", stalls: 40, type: "supercharger" },
  { x: 50, y: 76, city: "New Orleans", state: "Louisiana", stalls: 20, type: "supercharger" },
  { x: 64, y: 82, city: "Tampa", state: "Florida", stalls: 32, type: "supercharger" },
  { x: 67, y: 88, city: "Miami", state: "Florida", stalls: 44, type: "supercharger" },
  { x: 66, y: 78, city: "Orlando", state: "Florida", stalls: 28, type: "supercharger" },
  // Mid-Atlantic & Northeast
  { x: 65, y: 58, city: "Charlotte / Raleigh", state: "North Carolina", stalls: 32, type: "supercharger" },
  { x: 66, y: 49, city: "Washington", state: "DC", stalls: 36, type: "supercharger" },
  { x: 69, y: 45, city: "Philadelphia", state: "Pennsylvania", stalls: 32, type: "supercharger" },
  { x: 72, y: 41, city: "New York Hub", state: "New York", stalls: 52, type: "service" },
  { x: 74, y: 36, city: "Boston", state: "Massachusetts", stalls: 36, type: "supercharger" },
  { x: 63, y: 38, city: "Toronto", state: "Ontario", stalls: 32, type: "supercharger" },
  { x: 68, y: 34, city: "Montreal", state: "Quebec", stalls: 28, type: "supercharger" },
];

const STATE_LABELS = [
  { name: "WASHINGTON", x: 14, y: 25 },
  { name: "OREGON", x: 13, y: 38 },
  { name: "CALIFORNIA", x: 9, y: 66 },
  { name: "NEVADA", x: 17, y: 54 },
  { name: "IDAHO", x: 20, y: 33 },
  { name: "MONTANA", x: 28, y: 25 },
  { name: "WYOMING", x: 27, y: 38 },
  { name: "UTAH", x: 20, y: 48 },
  { name: "ARIZONA", x: 21, y: 70 },
  { name: "COLORADO", x: 29, y: 51 },
  { name: "NEW MEXICO", x: 28, y: 66 },
  { name: "NORTH DAKOTA", x: 37, y: 25 },
  { name: "SOUTH DAKOTA", x: 37, y: 35 },
  { name: "NEBRASKA", x: 37, y: 44 },
  { name: "KANSAS", x: 37, y: 54 },
  { name: "OKLAHOMA", x: 38, y: 64 },
  { name: "TEXAS", x: 35, y: 74 },
  { name: "MINNESOTA", x: 44, y: 29 },
  { name: "IOWA", x: 44, y: 43 },
  { name: "MISSOURI", x: 45, y: 54 },
  { name: "ARKANSAS", x: 46, y: 65 },
  { name: "LOUISIANA", x: 47, y: 75 },
  { name: "WISCONSIN", x: 50, y: 34 },
  { name: "ILLINOIS", x: 49, y: 47 },
  { name: "MICHIGAN", x: 56, y: 37 },
  { name: "INDIANA", x: 54, y: 48 },
  { name: "OHIO", x: 59, y: 47 },
  { name: "KENTUCKY", x: 54, y: 56 },
  { name: "TENNESSEE", x: 55, y: 62 },
  { name: "MISSISSIPPI", x: 50, y: 70 },
  { name: "ALABAMA", x: 54, y: 71 },
  { name: "GEORGIA", x: 58, y: 71 },
  { name: "FLORIDA", x: 65, y: 83 },
  { name: "NORTH CAROLINA", x: 65, y: 61 },
  { name: "VIRGINIA", x: 66, y: 53 },
  { name: "PENNSYLVANIA", x: 68, y: 44 },
  { name: "NEW YORK", x: 71, y: 37 },
  { name: "MASSACHUSETTS", x: 75, y: 35 },
];

export function TeslaInteractiveMap() {
  const [mapMode, setMapMode] = useState<"3d-print" | "satellite">("3d-print");
  const [userLocation, setUserLocation] = useState<{ x: number; y: number; label: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activePin, setActivePin] = useState<Pin | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFindMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setUserLocation({
            x: 48 + (pos.coords.longitude + 95) * 0.4,
            y: 52 - (pos.coords.latitude - 37) * 0.8,
            label: "Your Coordinates Synchronized",
          });
        },
        () => {
          setTimeout(() => {
            setIsLocating(false);
            setUserLocation({
              x: 50,
              y: 52,
              label: "Live Location Detected · Central Hub",
            });
          }, 600);
        },
        { timeout: 5000 }
      );
    } else {
      setTimeout(() => {
        setIsLocating(false);
        setUserLocation({
          x: 48,
          y: 50,
          label: "Live Location Detected · North America",
        });
      }, 500);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <section className="relative w-full border-t border-white/10 bg-[#060709] py-14 lg:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header HUD */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <X3Logo3D size="sm" />
            <div className="h-4 w-[1px] bg-white/20" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono uppercase tracking-[0.22em] text-white font-bold">
                  Global Fleet & Supercharger Infrastructure
                </h2>
                <span className="rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 px-2 py-0.5 text-[9px] font-mono text-[var(--primary)] font-bold">
                  3D TACTILE
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                50,000+ V4 Supercharger Stalls · 12 Global Gigasites · Sub-Millimeter Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: 3D Relief Print vs Satellite */}
            <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
              <button
                onClick={() => setMapMode("3d-print")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                  mapMode === "3d-print"
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                3D Relief Print
              </button>
              <button
                onClick={() => setMapMode("satellite")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                  mapMode === "satellite"
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Google Satellite
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors"
                aria-label="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3D Topographic Viewport */}
        <div
          ref={containerRef}
          className="relative w-full h-[560px] sm:h-[680px] overflow-hidden rounded-3xl border border-white/15 bg-[#090A0E] shadow-[0_24px_80px_rgba(0,0,0,0.9)] transition-all"
        >
          {mapMode === "3d-print" ? (
            /* Tactile 3D Relief Print Model with Extruded Mountain Ridges & States */
            <div
              className="absolute inset-0 transition-transform duration-500 origin-center"
              style={{
                transform: `scale(${zoom})`,
                perspective: "1200px",
              }}
            >
              {/* Outer Deep Ocean Bed */}
              <div className="absolute inset-0 bg-[#07080B] [background-image:radial-gradient(#151822_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />

              {/* 3D Continental Relief Baseplate (Extruded Shadow) */}
              <div
                className="absolute inset-8 rounded-3xl opacity-35 filter blur-xl bg-black"
                style={{ transform: "translateY(24px) scale(0.96)" }}
              />

              {/* SVG 3D Topographic Terrain Layer */}
              <svg
                viewBox="0 0 1000 620"
                className="absolute inset-0 h-full w-full select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Topographic 3D Relief Elevation Gradients */}
                  <linearGradient id="reliefElevation" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1B1E28" />
                    <stop offset="45%" stopColor="#141620" />
                    <stop offset="100%" stopColor="#0E1017" />
                  </linearGradient>

                  <linearGradient id="mountainRidge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#252A38" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#32384C" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#1A1D27" stopOpacity="0.4" />
                  </linearGradient>

                  <filter id="tactileBevel" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Continental Baseplate (Layer 1 - Lowest Elevation) */}
                <path
                  filter="url(#tactileBevel)"
                  fill="url(#reliefElevation)"
                  stroke="#2E3447"
                  strokeWidth="2"
                  d="M60,90 Q180,60 360,75 Q520,65 670,75 Q820,100 910,170 Q880,310 810,430 Q680,530 530,545 Q350,555 200,490 Q75,430 60,300 Z"
                />

                {/* Rocky Mountain 3D Ridge Elevation (Layer 2) */}
                <path
                  fill="url(#mountainRidge)"
                  stroke="#3D455D"
                  strokeWidth="1"
                  d="M170,120 Q240,160 260,250 Q280,330 260,420 Q230,460 210,480 Q190,430 180,340 Q170,230 170,120 Z"
                  opacity="0.85"
                />

                {/* Appalachian 3D Ridge Elevation (Layer 3) */}
                <path
                  fill="url(#mountainRidge)"
                  stroke="#3D455D"
                  strokeWidth="1"
                  d="M680,210 Q730,270 740,340 Q730,410 700,450 Q670,410 670,330 Q675,260 680,210 Z"
                  opacity="0.75"
                />

                {/* Precision Coordinate Lat/Long Grid Lines */}
                <g stroke="#1F2433" strokeWidth="0.8" strokeDasharray="4,6" opacity="0.65">
                  <line x1="80" y1="180" x2="920" y2="180" />
                  <line x1="80" y1="310" x2="920" y2="310" />
                  <line x1="80" y1="440" x2="920" y2="440" />
                  <line x1="240" y1="80" x2="240" y2="530" />
                  <line x1="420" y1="80" x2="420" y2="540" />
                  <line x1="600" y1="80" x2="600" y2="530" />
                  <line x1="780" y1="80" x2="780" y2="480" />
                </g>

                {/* State Border Tessellations */}
                <g stroke="#222736" strokeWidth="1" strokeDasharray="3,3" opacity="0.6">
                  {/* Western states */}
                  <line x1="160" y1="120" x2="160" y2="380" />
                  <line x1="100" y1="260" x2="220" y2="260" />
                  <line x1="100" y1="360" x2="250" y2="360" />
                  {/* Central states */}
                  <line x1="330" y1="180" x2="330" y2="480" />
                  <line x1="480" y1="180" x2="480" y2="520" />
                  <line x1="250" y1="300" x2="480" y2="300" />
                  <line x1="250" y1="410" x2="480" y2="410" />
                  {/* Eastern states */}
                  <line x1="620" y1="210" x2="620" y2="500" />
                  <line x1="720" y1="240" x2="720" y2="450" />
                </g>

                {/* Prominent State Labels */}
                {STATE_LABELS.map((st, idx) => (
                  <text
                    key={idx}
                    x={`${st.x * 10}`}
                    y={`${st.y * 6.2}`}
                    fill="#4C576D"
                    fontFamily="monospace"
                    fontSize="9.5"
                    fontWeight="700"
                    letterSpacing="1.2"
                    textAnchor="middle"
                    className="select-none transition-colors hover:fill-white"
                  >
                    {st.name}
                  </text>
                ))}
              </svg>

              {/* Real-time Dense Red Network Pins */}
              {NETWORK_PINS.map((pin, idx) => {
                const isSelected = activePin?.city === pin.city;

                return (
                  <div
                    key={idx}
                    onClick={() => setActivePin(pin)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-150 z-20"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  >
                    <div className="relative">
                      <span
                        className={`block h-3.5 w-3.5 rounded-full border-[1.5px] border-white transition-all ${
                          pin.type === "service"
                            ? "bg-[#E82127] shadow-[0_0_16px_rgba(232,33,39,1)] scale-110"
                            : "bg-[#E82127] shadow-[0_0_10px_rgba(232,33,39,0.85)]"
                        }`}
                      />
                      {pin.type === "service" && (
                        <span className="absolute -inset-2 rounded-full bg-[#E82127]/50 animate-ping" />
                      )}
                    </div>

                    {/* Rich Telemetry Tooltip */}
                    <div
                      className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-xl bg-black/95 border border-white/20 p-2.5 text-xs text-white shadow-2xl backdrop-blur-xl z-30 transition-all ${
                        isSelected ? "flex flex-col" : "hidden group-hover:flex flex-col"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{pin.city}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({pin.state})</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[10px] font-mono mt-1 text-[var(--primary)]">
                        <span>{pin.type === "service" ? "⚡ Giga Campus" : "⚡ Supercharger V4"}</span>
                        <span className="text-white/80">{pin.stalls} Stalls</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Live Customer Radar Beacon when Tracked */}
              {userLocation && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{ left: `${userLocation.x}%`, top: `${userLocation.y}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="h-5 w-5 rounded-full bg-white border-2 border-[var(--primary)] shadow-[0_0_20px_#E82127] animate-pulse" />
                    <span className="absolute -inset-4 rounded-full bg-[var(--primary)]/60 animate-ping" />
                  </div>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/95 border border-[var(--primary)] px-3 py-1.5 text-xs font-mono font-bold text-white shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {userLocation.label}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Google Satellite & Real-World High-Resolution Terrain Mode */
            <div className="relative h-full w-full">
              <iframe
                title="Google Satellite Fleet Map"
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15730302.261899166!2d-98.5795!3d39.8283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1715000000000!5m2!1sen!2sus"
                className="h-full w-full border-0 filter invert-[92%] hue-rotate-180 contrast-125 brightness-90"
                allowFullScreen={false}
                loading="lazy"
              />
              <div className="absolute top-4 left-4 z-20 rounded-xl bg-black/80 border border-white/20 px-3.5 py-1.5 text-xs font-mono text-white backdrop-blur-md">
                Satellite Sensor Feed · High-Resolution Real World Terrain
              </div>
            </div>
          )}

          {/* Bottom Left "Find Me" HUD Beacon */}
          <div className="absolute bottom-5 left-5 z-30 flex items-center gap-3">
            <button
              onClick={handleFindMe}
              disabled={isLocating}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/85 px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-bold text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black hover:border-[var(--primary)] hover:scale-105 active:scale-95 disabled:opacity-75"
            >
              <Locate className={`h-4 w-4 text-[#E82127] ${isLocating ? "animate-spin" : ""}`} />
              {isLocating ? "Locating Live..." : "Find Me"}
            </button>

            {activePin && (
              <div className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/80 px-3 py-2 text-xs font-mono text-white/90 backdrop-blur-md">
                <span className="text-[var(--primary)] font-bold">{activePin.city}:</span>
                <span>{activePin.stalls} Fast Stalls Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 py-4 text-xs font-mono uppercase tracking-wider font-bold text-white shadow-md backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30"
          >
            <MessageSquare className="h-4 w-4 text-[#E82127]" />
            Ask a Question
          </a>

          <a
            href="/portal"
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 py-4 text-xs font-mono uppercase tracking-wider font-bold text-white shadow-md backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30"
          >
            <Car className="h-4 w-4 text-[#E82127]" />
            Schedule a Drive Today
          </a>
        </div>
      </div>
    </section>
  );
}
