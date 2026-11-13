import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { X3Logo3D } from "@/components/x3-logo-3d";

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  angle: string;
  kicker: string;
  specs: { label: string; value: string }[];
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "front",
    image: "/assets/roadster/roadster-studio-white.jpg",
    title: "Aerodynamic Purity",
    angle: "Front Aspect",
    kicker: "Sub-Two-Second Acceleration",
    specs: [
      { label: "0-60 mph", value: "1.9 sec" },
      { label: "Top Speed", value: "+250 mph" },
      { label: "Powertrain", value: "Tri-Motor AWD" },
    ],
  },
  {
    id: "steering",
    image: "/assets/roadster/roadster-yoke-steering.jpg",
    title: "Steer-by-Wire Flight Yoke",
    angle: "Pilot Cockpit",
    kicker: "Direct Variable-Ratio Steering",
    specs: [
      { label: "Interface", value: "Digital Yoke" },
      { label: "Telemetry", value: "Track OLED" },
      { label: "Feedback", value: "Haptic Mesh" },
    ],
  },
  {
    id: "interior",
    image: "/assets/roadster/roadster-interior-cockpit.jpg",
    title: "Sculpted Interior Body",
    angle: "Cabin Architecture",
    kicker: "Acoustic Glass Canopy",
    specs: [
      { label: "Layout", value: "2+2 Seating" },
      { label: "Center Console", value: "Floating Carbon" },
      { label: "Ambient Lighting", value: "Ultra Red Glow" },
    ],
  },
  {
    id: "wheel",
    image: "/assets/roadster/roadster-wheel-tire.jpg",
    title: "Machined Aero Wheels & High-G Tires",
    angle: "Track Contact Patch",
    kicker: "High-Downforce Compound",
    specs: [
      { label: "Tires", value: "Pirelli Trofeo RS" },
      { label: "Wheels", value: "Forged Monoblock" },
      { label: "Brakes", value: "Carbon Ceramic" },
    ],
  },
  {
    id: "seats",
    image: "/assets/roadster/roadster-sport-seats.jpg",
    title: "Composite Sport Bucket Seats",
    angle: "Lateral Support",
    kicker: "Integrated Headrest Telemetry",
    specs: [
      { label: "Structure", value: "Raw Carbon Inlay" },
      { label: "Insignia", value: "Illuminated Red" },
      { label: "Harness", value: "Track-Ready 4-Point" },
    ],
  },
];

interface HeroMovingShowcaseProps {
  onOpenConfigurator?: (productId?: string) => void;
}

export function HeroMovingShowcase({ onOpenConfigurator }: HeroMovingShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const DURATION_MS = 5000;

  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, DURATION_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIndex]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const currentSlide = HERO_SLIDES[currentIndex];

  return (
    <div className="relative w-full h-[90vh] min-h-[660px] max-h-[980px] overflow-hidden select-none bg-neutral-950">
      {/* High-Luminance Studio White Ambient Floodlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-90"
        style={{
          background:
            "radial-gradient(1200px 700px at 60% 48%, rgba(255, 255, 255, 0.45) 0%, rgba(240, 245, 255, 0.22) 35%, rgba(220, 225, 240, 0.08) 65%, transparent 85%), radial-gradient(ellipse 900px 300px at 60% 88%, rgba(255, 255, 255, 0.35) 0%, transparent 70%)",
        }}
      />

      {/* Moving Background Slides with Ken-Burns Motion & Smooth Crossfade */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Vehicle Photography with Zero Muddy Overlay */}
            <img
              src={slide.image}
              alt={slide.title}
              className={`h-full w-full object-cover object-center filter contrast-[1.08] brightness-[1.06] ${
                isActive ? "animate-[kenburns_16s_ease-out_forwards]" : ""
              }`}
            />

            {/* Bright Studio Light Shimmer & Contrast Accents */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 65% 40%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.1) 45%, transparent 75%)",
              }}
            />

            {/* Crisp Left-Side Scrim strictly for Typography Readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent w-full md:w-[65%]" />
            <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />

            {/* Laminated X3 Watermark on the Roadster Photography */}
            <div className="absolute top-24 right-8 z-20 pointer-events-none hidden sm:flex items-center gap-2.5 rounded-lg border border-white/20 bg-black/35 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
              <X3Logo3D size="sm" variant="watermark" enableHoverTilt={false} />
              <div className="h-3 w-[1px] bg-white/20" />
              <span className="text-[9px] uppercase font-mono tracking-[0.28em] text-white/70">
                X3 · Laminated Mark
              </span>
            </div>

            {/* Deep Crimson Atmospheric Glow (Zero Pink) */}
            <div
              className="absolute -right-16 -top-16 h-80 w-80 rounded-full opacity-25 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(232, 33, 39, 0.4) 0%, transparent 70%)" }}
            />
          </div>
        );
      })}

      {/* Floating Interactive Content Overlay */}
      <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-between px-6 pb-12 pt-28 pointer-events-none">
        {/* Pristine, Unobstructed Hero Headline (Zero Blocking Badges or Overlays) */}
        <div className="max-w-2xl pointer-events-auto">
          <h1 className="font-sans text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.04] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            A True Pilot’s Car.
          </h1>
        </div>

        {/* Bottom Section: Dynamic Specs Ribbon, Action Controls & View Selector */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            {/* Left: Quick Specs Strip for Active View */}
            <div className="md:col-span-7 flex flex-wrap items-center gap-6 sm:gap-10 border-t border-white/30 pt-4 backdrop-blur-md rounded-xl p-3 bg-black/30 border border-white/15">
              {currentSlide.specs.map((s, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                    {s.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gray-200 font-semibold">
                    {s.label}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                <button
                  onClick={() => onOpenConfigurator?.("cyberbot")}
                  className="rounded-full px-7 py-3 text-xs font-bold text-white shadow-[0_0_25px_rgba(232,33,39,0.5)] transition-all duration-300 hover:scale-105"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  Order
                </button>
              </div>
            </div>

            {/* Right: Angle Selectors (Moving Tabs with High-Contrast White Glow) */}
            <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2">
              {HERO_SLIDES.map((slide, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(idx)}
                    className={`group relative rounded-xl px-4 py-2 text-xs font-semibold transition-all backdrop-blur-xl ${
                      isSelected
                        ? "border border-white/60 bg-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105"
                        : "border border-white/15 bg-black/50 text-white/70 hover:border-white/40 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{slide.angle.split(" ")[0]}</span>
                    {/* Animated Progress Bar when active and playing */}
                    {isSelected && isPlaying && (
                      <div className="absolute bottom-0 left-0 h-[2.5px] w-full overflow-hidden rounded-b-xl bg-white/30">
                        <div
                          className="h-full bg-white shadow-[0_0_8px_#ffffff] animate-[shimmer_5s_linear_infinite]"
                          style={{
                            width: "100%",
                            animationDuration: `${DURATION_MS}ms`,
                          }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Prev / Next & Pause Controls */}
              <div className="flex items-center gap-1 ml-2 border-l border-white/30 pl-2">
                <button
                  onClick={prevSlide}
                  className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                  aria-label="Previous view"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                  aria-label="Next view"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                  aria-label={isPlaying ? "Pause auto-advance" : "Resume auto-advance"}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
