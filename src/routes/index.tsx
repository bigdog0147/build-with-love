import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Volume2, VolumeX, Globe } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TeslaConfiguratorModal } from "@/components/tesla-configurator-modal";

export const Route = createFileRoute("/")({
  component: TeslaHomePage,
  head: () => ({
    meta: [
      { title: "Electric Cars, Solar & Clean Energy | X3" },
      {
        name: "description",
        content: "High-performance electric vehicles, commercial fleet robotics, and scalable renewable energy storage.",
      },
    ],
  }),
});

interface SectionItem {
  id: string;
  title: string;
  subtitle: string;
  priceNote?: string;
  learnMoreUrl: string;
  orderProductId: string;
  mediaType: "video" | "image";
  mediaSrc: string;
  hasAudio?: boolean;
}

const SECTIONS: SectionItem[] = [
  {
    id: "model-y",
    title: "Model Y",
    subtitle: "From $31,490",
    priceNote: "After Federal Tax Credit & Est. Gas Savings",
    learnMoreUrl: "/model-y",
    orderProductId: "model-y",
    mediaType: "image",
    mediaSrc: "/assets/vehicles/model-y.avif",
  },
  {
    id: "model-3",
    title: "Model 3",
    subtitle: "Lease Starting at $299/mo",
    priceNote: "From $34,990 After Est. Savings",
    learnMoreUrl: "/model-3",
    orderProductId: "model-3",
    mediaType: "image",
    mediaSrc: "/assets/vehicles/model-3.avif",
  },
  {
    id: "cybertruck",
    title: "Cybertruck",
    subtitle: "Lease Starting at $799/mo",
    priceNote: "Built for Any Planet",
    learnMoreUrl: "/cybertruck",
    orderProductId: "cybertruck",
    mediaType: "image",
    mediaSrc: "/assets/cybertruck/cybertruck-hero.avif",
  },
  {
    id: "roadster",
    title: "Roadster",
    subtitle: "1.9 s 0-60 mph · +250 mph",
    priceNote: "Pure Electric Aerodynamic Flight Platform",
    learnMoreUrl: "/roadster",
    orderProductId: "roadster",
    mediaType: "video",
    mediaSrc: "/showcase-video.mp4",
    hasAudio: true,
  },
  {
    id: "robotics",
    title: "Optimus & Fleet",
    subtitle: "Autonomous Bipedal Robotics",
    priceNote: "Physical AI for Industrial Logistics & Assembly",
    learnMoreUrl: "/robotics",
    orderProductId: "cyberbot",
    mediaType: "image",
    mediaSrc: "/assets/roadster/official-gallery/5-front-beam-cinematic.jpg",
  },
];

function TeslaHomePage() {
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [configuratorProduct, setConfiguratorProduct] = useState("model-y");
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isAudioMuted;
    videoRef.current.muted = nextMuted;
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleOrder = (productId: string) => {
    setConfiguratorProduct(productId);
    setConfiguratorOpen(true);
  };

  return (
    <div className="bg-black text-white font-sans antialiased selection:bg-[#3E6AE1] selection:text-white">
      {/* Official Tesla Global Header */}
      <SiteHeader />

      {/* Vertical Full-Bleed Viewport Sections (Exact Tesla Architecture) */}
      <main className="w-full">
        {SECTIONS.map((sec, idx) => (
          <section
            key={sec.id}
            id={sec.id}
            className="relative h-screen min-h-[640px] w-full flex flex-col justify-between items-center text-center px-6 pt-24 pb-14 overflow-hidden border-b border-white/5 snap-start"
          >
            {/* Background Media */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {sec.mediaType === "video" ? (
                <video
                  ref={videoRef}
                  src={sec.mediaSrc}
                  autoPlay
                  loop
                  muted={isAudioMuted}
                  playsInline
                  className="w-full h-full object-cover object-center filter contrast-110 brightness-90"
                />
              ) : (
                <img
                  src={sec.mediaSrc}
                  alt={sec.title}
                  className="w-full h-full object-cover object-center filter contrast-115 brightness-95"
                />
              )}
              {/* Subtle top/bottom gradient to guarantee legibility */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>

            {/* Video Sound Toggle Button (For the Roadster / Showcase video) */}
            {sec.hasAudio && (
              <div className="absolute top-24 right-6 z-20 pointer-events-auto">
                <button
                  onClick={toggleSound}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-black/60 backdrop-blur-md text-white text-xs font-mono font-semibold transition-all hover:bg-black/90 hover:scale-105 shadow-xl"
                  aria-label="Toggle Video Audio"
                >
                  {isAudioMuted ? (
                    <>
                      <VolumeX className="h-4 w-4 text-white/70" />
                      <span>Unmute Sound</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 font-bold">Sound ON</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Top Text: Crisp, Minimal Title & Subhead (Tesla Parity) */}
            <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center pt-2 sm:pt-4">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {sec.title}
              </h2>
              <div className="mt-2 text-base sm:text-lg text-white font-medium drop-shadow-md">
                {sec.subtitle}
              </div>
              {sec.priceNote && (
                <div className="mt-1 text-xs text-white/70 font-light drop-shadow">
                  {sec.priceNote}
                </div>
              )}
            </div>

            {/* Center Area: Completely Clear to Showcase the Vehicle Photography */}
            <div className="flex-1 w-full pointer-events-none" />

            {/* Bottom Actions: Clean Tesla Dual Buttons */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              <button
                onClick={() => handleOrder(sec.orderProductId)}
                className="w-full sm:w-64 h-11 rounded-md bg-[#3E6AE1] hover:bg-[#3457B2] text-white font-medium text-xs sm:text-sm tracking-wide uppercase transition-all shadow-xl flex items-center justify-center"
              >
                Order Now
              </button>

              <Link
                to={sec.learnMoreUrl}
                className="w-full sm:w-64 h-11 rounded-md bg-white/80 hover:bg-white text-[#171A20] font-medium text-xs sm:text-sm tracking-wide uppercase backdrop-blur-md transition-all shadow-xl flex items-center justify-center text-center"
              >
                Learn More
              </Link>
            </div>
          </section>
        ))}
      </main>

      {/* Interactive Configurator Modal */}
      <TeslaConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        defaultProductId={configuratorProduct}
      />

      {/* Official Tesla Minimalist Footer */}
      <SiteFooter />
    </div>
  );
}
