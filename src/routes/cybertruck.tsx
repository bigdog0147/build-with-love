import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield,
  Zap,
  Gauge,
  Compass,
  Wind,
  Layers,
  Menu,
  X,
  ArrowRight,
  Sliders,
  CheckCircle2,
  BatteryCharging,
  Globe,
  CreditCard,
  Truck,
  Flame,
  Check,
} from "lucide-react";
import { TeslaConfiguratorModal } from "@/components/tesla-configurator-modal";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/cybertruck")({
  component: OfficialCybertruckPage,
  head: () => ({
    meta: [
      { title: "Cybertruck | Built for Any Planet | X3" },
      {
        name: "description",
        content:
          "Ultra-Hard 30X Cold-Rolled stainless-steel exoskeleton, armor glass, steer-by-wire, 11,000 lbs towing capacity, and 2.6s 0-60 mph Cyberbeast acceleration.",
      },
    ],
  }),
});

interface CyberFeature {
  id: string;
  title: string;
  copy: string;
  spec: string;
  sub: string;
}

const CYBER_FEATURES: CyberFeature[] = [
  {
    id: "exoskeleton",
    title: "Ultra-Hard 30X Cold-Rolled Stainless Steel",
    copy: "Helps eliminate dents, damage and long-term corrosion. Smooth monochrome exoskeleton puts the shell on the outside of the vehicle, providing maximum passenger protection.",
    spec: "30X",
    sub: "Cold-Rolled Alloy",
  },
  {
    id: "armor-glass",
    title: "Shatter-Resistant Armor Glass",
    copy: "Acoustic glass can resist the impact of a baseball at 70 mph or Class 4 hail. Acoustic treatment ensures whisper-quiet cabin acoustics across rough terrain.",
    spec: "Class 4",
    sub: "Hail Resistant",
  },
  {
    id: "suspension",
    title: "Adaptive Air Suspension",
    copy: "Electronically adaptive air suspension offers 12 inches of travel and up to 16 inches of ground clearance with on-the-fly dampening adjustments.",
    spec: "16 in",
    sub: "Max Ground Clearance",
  },
  {
    id: "powershare",
    title: "Powershare Generator & Outlets",
    copy: "Integrated 120V and 240V bed and cabin outlets supply up to 11.5 kW of continuous power to your tools or power your entire home during an electrical outage.",
    spec: "11.5 kW",
    sub: "Home Backup Power",
  },
];

const STUDIO_ANGLES = [
  {
    id: "front",
    label: "Exterior Exoskeleton",
    image: "/assets/cybertruck/cybertruck-hero.avif",
    desc: "Laser-cut 30X cold-rolled stainless steel shell with shatter-resistant armor glass canopy.",
  },
  {
    id: "side",
    label: "340-Mile AWD Profile",
    image: "/assets/vehicles/model-y.avif",
    desc: "Monolithic geometric body designed to eliminate panel gaps and maximize aerodynamic efficiency.",
  },
  {
    id: "bed",
    label: "Motorized Vault & Bed",
    image: "/assets/roadster/official-gallery/5-front-beam-cinematic.jpg",
    desc: "6' x 4' composite bed with flush motorized tonneau cover capable of supporting 300 lbs.",
  },
];

function OfficialCybertruckPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [selectedTrim, setSelectedTrim] = useState<"cyberbeast" | "awd">("cyberbeast");
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  const [vaultCoverClosed, setVaultCoverClosed] = useState(true);
  const [suspensionMode, setSuspensionMode] = useState<"Entry" | "Medium" | "High">("Medium");

  const activeAngle = STUDIO_ANGLES[activeAngleIndex];

  return (
    <div className="min-h-screen bg-[#07080B] text-[#D8DAE2] font-sans antialiased selection:bg-[#E6A020] selection:text-black">
      
      {/* ===================================================================== */}
      {/* SOLID OPAQUE HEADER (ZERO TEXT OVERLAPPING ON SCROLL)                */}
      {/* ===================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-3.5 bg-[#07080B]/95 backdrop-blur-2xl border-b border-white/10 shadow-lg">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-mono text-xl sm:text-2xl font-black tracking-[0.35em] text-white uppercase group-hover:text-[#E6A020] transition-colors">
            X3
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-white/70">
          <Link to="/roadster" className="hover:text-white transition-colors">Roadster</Link>
          <span className="text-[#E6A020] font-bold">Cybertruck</span>
          <Link to="/model-3" className="hover:text-white transition-colors">Model 3</Link>
          <Link to="/model-y" className="hover:text-white transition-colors">Model Y</Link>
          <Link to="/robotics" className="hover:text-white transition-colors">Robotics</Link>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
          <button
            onClick={() => setConfiguratorOpen(true)}
            className="px-4 py-1.5 rounded-full bg-[#E6A020] hover:bg-[#cf8e18] text-black font-bold transition-all shadow-md"
          >
            Order Now
          </button>
          <Link
            to="/portal"
            className="hidden sm:inline-flex text-white/80 hover:text-white transition-colors px-2 py-1"
          >
            Digital Cockpit
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/15 bg-white/5 text-white"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-14 z-50 border-b border-white/15 bg-[#07080B] p-6 shadow-2xl animate-in slide-in-from-top-2 space-y-4 font-mono text-xs uppercase tracking-wider">
          <Link to="/roadster" onClick={() => setMenuOpen(false)} className="block py-2 text-white/80 hover:text-white">Roadster</Link>
          <Link to="/cybertruck" onClick={() => setMenuOpen(false)} className="block py-2 text-[#E6A020] font-bold">Cybertruck</Link>
          <Link to="/model-3" onClick={() => setMenuOpen(false)} className="block py-2 text-white/80 hover:text-white">Model 3</Link>
          <Link to="/model-y" onClick={() => setMenuOpen(false)} className="block py-2 text-white/80 hover:text-white">Model Y</Link>
          <Link to="/robotics" onClick={() => setMenuOpen(false)} className="block py-2 text-white/80 hover:text-white">Robotics</Link>
          <Link to="/inflow" onClick={() => setMenuOpen(false)} className="block py-2 text-white/80 hover:text-white">Inflow</Link>
          <Link to="/invoice" onClick={() => setMenuOpen(false)} className="block py-2 text-white/80 hover:text-white">Invoice</Link>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-white font-bold">Sign In</Link>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. HERO SECTION: FULL-BLEED CYBERTRUCK (CLEAN, ZERO BLOCKING CARDS)  */}
      {/* ===================================================================== */}
      <section className="relative h-screen min-h-[700px] flex flex-col justify-between items-center text-center px-6 pt-24 pb-10 overflow-hidden border-b border-white/10">
        
        {/* Full-Bleed Background Photography */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/assets/cybertruck/cybertruck-hero.avif"
            alt="Cybertruck Exoskeleton"
            className="w-full h-full object-cover object-center filter contrast-125 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-transparent to-black/60" />
        </div>

        {/* Top Minimal Title (Tesla Style) */}
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <h1 className="font-mono font-black uppercase tracking-[0.2em] text-5xl sm:text-7xl md:text-8xl text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
            CYBERTRUCK
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/80 font-light">
            Built for any planet. More utility than a truck with more performance than a sports car.
          </p>
        </div>

        {/* Bottom Horizontal Specs Bar & Clean Action Buttons */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
          
          {/* Clean Specs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-10 text-center mb-6 font-mono">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">11,000 lbs</div>
              <div className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">Towing Capacity</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#E6A020]">2.6 s</div>
              <div className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">0-60 MPH (Cyberbeast)</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">340 mi</div>
              <div className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">Estimated Range</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">2,500 lbs</div>
              <div className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">Max Payload</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md font-mono text-xs font-bold uppercase tracking-[0.2em]">
            <button
              onClick={() => setConfiguratorOpen(true)}
              className="w-full sm:w-52 py-3.5 px-6 rounded-md bg-[#E6A020] hover:bg-[#cf8e18] text-black shadow-lg shadow-[#E6A020]/25 transition-all text-center"
            >
              Order Now
            </button>
            <Link
              to="/portal"
              className="w-full sm:w-52 py-3.5 px-6 rounded-md border border-white/20 bg-black/60 hover:bg-black/90 text-white text-center transition-all backdrop-blur-md"
            >
              Digital Cockpit
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. BUILT FOR ANY PLANET FEATURES                                     */}
      {/* ===================================================================== */}
      <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#E6A020] mb-2 font-bold">
            Engineering Specifications
          </div>
          <h2 className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-white mb-3 uppercase">
            Built For Any Planet
          </h2>
          <div className="w-20 h-[2px] bg-[#E6A020] mx-auto mb-6" />
          <p className="text-sm sm:text-base text-[#A8ABB7]">
            Extreme durability and passenger protection across extreme earthly and off-world environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CYBER_FEATURES.map((feat) => (
            <div key={feat.id} className="rounded-2xl border border-white/10 bg-[#0E1015] p-8 space-y-4">
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <span className="font-mono text-3xl font-black text-[#E6A020]">{feat.spec}</span>
                <span className="font-mono text-xs uppercase text-white/50">{feat.sub}</span>
              </div>
              <h3 className="font-mono text-xl font-bold text-white">{feat.title}</h3>
              <p className="text-xs sm:text-sm text-[#9CA0B0] leading-relaxed">{feat.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. INTERACTIVE STUDIO SHOWCASE                                        */}
      {/* ===================================================================== */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#E6A020] mb-2 font-bold">
            Interactive Studio
          </div>
          <h2 className="text-3xl sm:text-4xl font-mono font-bold uppercase text-white mb-2">
            Exoskeleton & Telemetry
          </h2>
          <p className="text-xs sm:text-sm font-mono text-white/50">
            Explore 30X Cold-Rolled Stainless Steel &middot; Adaptive Air Suspension &middot; Motorized Vault
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-black/80 overflow-hidden shadow-2xl">
          {/* Main Visual */}
          <div className="relative aspect-[16/9] w-full bg-black">
            <img
              src={activeAngle.image}
              alt={activeAngle.label}
              className="w-full h-full object-cover object-center filter contrast-115 brightness-95 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
            
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-black/80 border border-white/15 backdrop-blur-md max-w-md">
                <div className="text-base font-bold text-[#E6A020]">{activeAngle.label}</div>
                <div className="text-white/70 mt-1">{activeAngle.desc}</div>
              </div>

              {/* Suspension & Vault Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVaultCoverClosed(!vaultCoverClosed)}
                  className="px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  Vault: {vaultCoverClosed ? "CLOSED" : "OPEN"}
                </button>
                <button
                  onClick={() =>
                    setSuspensionMode(
                      suspensionMode === "Medium" ? "High" : suspensionMode === "High" ? "Entry" : "Medium"
                    )
                  }
                  className="px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  Ride: {suspensionMode.toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          {/* Angle Switcher Tabs */}
          <div className="p-4 bg-[#0A0B10] border-t border-white/10 flex flex-wrap gap-2 justify-center font-mono text-xs">
            {STUDIO_ANGLES.map((ang, idx) => (
              <button
                key={ang.id}
                onClick={() => setActiveAngleIndex(idx)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeAngleIndex === idx
                    ? "bg-[#E6A020] text-black font-bold shadow"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {ang.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Configurator Modal */}
      <TeslaConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        defaultProductId="cybertruck"
      />

      <SiteFooter />
    </div>
  );
}
