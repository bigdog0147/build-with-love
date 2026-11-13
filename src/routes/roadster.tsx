import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Flame,
  Fan,
  Wind,
  Globe,
  CreditCard,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { TeslaVehicle3DCanvas } from "@/components/tesla-vehicle-3d-canvas";

export const Route = createFileRoute("/roadster")({
  component: OfficialRoadsterPage,
  head: () => ({
    meta: [
      { title: "Roadster — Electric Hypercar | X3" },
      {
        name: "description",
        content:
          "Official X3 Roadster architecture. Beyond Plaid: active aerodynamics, multi-mode suction systems, cold-gas thrusters, and 0-60 in under 1 second.",
      },
    ],
  }),
});

interface FeatureSlide {
  id: string;
  title: string;
  copy: string;
  image: string;
}

const CAROUSEL_SLIDES: FeatureSlide[] = [
  {
    id: "hidden-aero",
    title: "Hidden Aero",
    copy: "Designed to be minimalist yet highly technical. Hidden headlights, a full-length taillight and flush-mounted aerodynamics conceal the vehicle's true form. It is grounded by super light wheels with thin spokes that reinforce its structural strength when earthbound.",
    image: "/assets/roadster/official-gallery/5-hidden-aero.jpg",
  },
  {
    id: "ano-white",
    title: "Ano White",
    copy: "Ano White paint takes inspiration from aerospace techniques that provide UV and cryogenic protection when exposed to the harshness of space, plus electrostatic dissipation and corrosion resistance to protect rockets during pre-launch and recovery.",
    image: "/assets/roadster/official-gallery/6-ano-white.jpg",
  },
  {
    id: "gold-glazed",
    title: "Gold Glazed",
    copy: "Tinted glass windows are designed to mimic the copper coating that gives spacesuit visors their gold radiance. Subtle titanium accents further embody space-age design while accentuating the vehicle's lines.",
    image: "/assets/roadster/official-gallery/7-gold-glazed-doors.jpg",
  },
  {
    id: "supersonic",
    title: "Supersonic",
    copy: "Our iconic Ultrawhite interior is accented with gray microsuede detailing. Seats feature microsuede bolsters for added grip. Yoke is designed specifically for steer by wire. A center touchscreen supported by two smaller forward displays provides critical driving info.",
    image: "/assets/roadster/official-gallery/8-supersonic-interior.jpg",
  },
  {
    id: "mass-control",
    title: "Mass Control",
    copy: "First principles engineering, manual controls and a fixed seat position help reduce overall vehicle mass. With lightweight, high-strength materials throughout, including magnesium, titanium and carbon fiber, we are able to achieve even greater reductions. This allows Roadster to respond to driver inputs almost instantly during extra-dimensional driving.",
    image: "/assets/roadster/official-gallery/9-mass-control-suspension.jpg",
  },
];

const CONFIG_CAR_IMAGES = [
  { id: "rear-three-quarter", label: "Rear Profile", src: "/assets/roadster/official-gallery/25-configurator-performance.jpg" },
  { id: "front-profile", label: "Front Profile", src: "/assets/roadster/official-gallery/3-true-pilot-profile.jpg" },
  { id: "interior-supersonic", label: "Cockpit", src: "/assets/roadster/official-gallery/8-supersonic-interior.jpg" },
  { id: "thruster-wing", label: "Cold-Gas Nozzles", src: "/assets/roadster/official-gallery/18-rear-wing-red-glow.jpg" },
];

function OfficialRoadsterPage() {
  const [viewMode, setViewMode] = useState<"showcase" | "configurator">("showcase");
  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false);

  // Configurator state (Exact 1:1 match with Tesla screenshots)
  const [selectedTrim, setSelectedTrim] = useState<"performance" | "thrust" | "rocket">("performance");
  const [configCarImageIdx, setConfigCarImageIdx] = useState(0);
  const [use3DInConfig, setUse3DInConfig] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 3D Canvas dynamic controls
  const [show3DDigitalTwin, setShow3DDigitalTwin] = useState(false);
  const [isDriving3D, setIsDriving3D] = useState(true);
  const [thrusterActive, setThrusterActive] = useState(false);

  const prevSlide = () => {
    setActiveSlide((curr) => (curr === 0 ? CAROUSEL_SLIDES.length - 1 : curr - 1));
  };

  const nextSlide = () => {
    setActiveSlide((curr) => (curr === CAROUSEL_SLIDES.length - 1 ? 0 : curr + 1));
  };

  const prevConfigImage = () => {
    setConfigCarImageIdx((curr) => (curr === 0 ? CONFIG_CAR_IMAGES.length - 1 : curr - 1));
  };

  const nextConfigImage = () => {
    setConfigCarImageIdx((curr) => (curr === CONFIG_CAR_IMAGES.length - 1 ? 0 : curr + 1));
  };

  const testThrusters = () => {
    setThrusterActive(true);
    setTimeout(() => setThrusterActive(false), 2400);
  };

  const handlePayment = (method: "gpay" | "card") => {
    setPaymentSuccess(true);
    setTimeout(() => setPaymentSuccess(false), 4500);
  };

  // =========================================================================
  // VIEW MODE: OFFICIAL 1:1 SPLIT CONFIGURATOR (RESERVE FLOW)
  // =========================================================================
  if (viewMode === "configurator") {
    return (
      <div className="min-h-screen bg-black text-[#F4F4F6] font-sans antialiased flex flex-col justify-between selection:bg-[#C88A3E] selection:text-black">
        
        {/* Top Minimalist Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-6 bg-gradient-to-b from-black via-black/60 to-transparent">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-[0.35em] text-white uppercase group-hover:text-[#C88A3E] transition-colors">
              X3
            </span>
          </Link>

          <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest">
            <button
              onClick={() => setViewMode("showcase")}
              className="text-white/60 hover:text-white transition-colors"
            >
              ← Overview
            </button>
            <div className="flex items-center gap-1.5 text-white/80">
              <Globe className="h-4 w-4 text-white/70" />
              <span>US</span>
            </div>
          </div>
        </header>

        {/* Payment Confirmation Toast */}
        {paymentSuccess && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-emerald-500/50 bg-black/95 px-8 py-4 text-xs font-mono text-emerald-400 shadow-2xl backdrop-blur-2xl flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <div className="font-bold uppercase text-white">Reservation Deposit Confirmed ($5,000)</div>
              <div className="text-white/60 mt-0.5">Priority serial allocated. Wire payment instruction sent to your email.</div>
            </div>
          </div>
        )}

        {/* Main Two-Column Split Layout */}
        <div className="relative pt-24 pb-12 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen overflow-hidden">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: VEHICLE VIEWER & CAROUSEL                            */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 relative flex flex-col justify-center items-center p-6 lg:p-12 min-h-[460px] lg:min-h-full">
            
            {/* Viewport Frame */}
            <div className="relative w-full max-w-2xl aspect-[16/10] flex items-center justify-center">
              {use3DInConfig ? (
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black/80 shadow-2xl">
                  <TeslaVehicle3DCanvas
                    model="roadster"
                    isDriving={isDriving3D}
                    speed={selectedTrim === "rocket" ? 180 : selectedTrim === "thrust" ? 120 : 74}
                    thrusterFiring={selectedTrim === "rocket" || thrusterActive}
                    headlightsOn={true}
                  />
                </div>
              ) : (
                <div className="w-full h-full relative rounded-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src={CONFIG_CAR_IMAGES[configCarImageIdx].src}
                    alt="Roadster Studio View"
                    className="w-full h-full object-contain filter contrast-110 brightness-95 transition-opacity duration-500"
                  />
                </div>
              )}
            </div>

            {/* Carousel Navigation Strip: Exact Tesla Arrow and Dot Controls */}
            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                onClick={prevConfigImage}
                disabled={use3DInConfig}
                className="p-2 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                {CONFIG_CAR_IMAGES.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setUse3DInConfig(false);
                      setConfigCarImageIdx(i);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      !use3DInConfig && configCarImageIdx === i
                        ? "w-6 bg-white"
                        : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
                
                {/* 3D Mode Dot */}
                <button
                  onClick={() => setUse3DInConfig(!use3DInConfig)}
                  className={`h-2 rounded-full transition-all flex items-center px-2 py-1 text-[9px] font-mono uppercase ${
                    use3DInConfig ? "bg-[#C88A3E] text-black font-bold" : "bg-white/20 text-white/60 hover:bg-white/40"
                  }`}
                >
                  3D
                </button>
              </div>

              <button
                onClick={nextConfigImage}
                disabled={use3DInConfig}
                className="p-2 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: STICKY CONFIGURATOR & PAYMENT DECK                  */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 relative flex flex-col justify-start p-6 lg:p-12 lg:border-l lg:border-white/10 overflow-y-auto max-w-xl mx-auto w-full">
            
            {/* Top Champagne Gold ROADSTER Logo */}
            <div className="text-center sm:text-left mb-10">
              <h1
                className="font-black italic uppercase tracking-[0.18em] text-4xl sm:text-5xl text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(180deg, #F9ECD5 0%, #D8B785 50%, #A27D4C 100%)",
                }}
              >
                ROADSTER
              </h1>
            </div>

            {/* Base Configuration: Performance */}
            <div
              onClick={() => setSelectedTrim("performance")}
              className={`p-6 rounded-md border cursor-pointer transition-all duration-300 mb-8 ${
                selectedTrim === "performance"
                  ? "border-white bg-[#101014] shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                  : "border-white/15 bg-black/40 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Performance
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-white/70">
                  Reserve
                </span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-[#A8ABB7] leading-relaxed font-light">
                Road ready with seating for two. Includes active aero and a multi-mode suction system.
              </p>
            </div>

            {/* Section Heading: Augments */}
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/50 mb-4 font-semibold">
              Augments
            </div>

            {/* Augment 1: Thrust */}
            <div
              onClick={() => setSelectedTrim("thrust")}
              className={`p-6 rounded-md border cursor-pointer transition-all duration-300 mb-4 ${
                selectedTrim === "thrust"
                  ? "border-white bg-[#101014] shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                  : "border-white/15 bg-black/40 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Thrust
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-[#C88A3E] font-semibold">
                  Limited
                </span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-[#A8ABB7] leading-relaxed font-light">
                Race ready with seating for two. Includes Performance active aero and a multi-mode suction system, plus acceleration thrusters.
              </p>
            </div>

            {/* Augment 2: Rocket */}
            <div
              onClick={() => setSelectedTrim("rocket")}
              className={`p-6 rounded-md border cursor-pointer transition-all duration-300 mb-8 ${
                selectedTrim === "rocket"
                  ? "border-white bg-[#101014] shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                  : "border-white/15 bg-black/40 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Rocket
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-white/40 font-semibold">
                  Invite Only
                </span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-[#A8ABB7] leading-relaxed font-light">
                Air ready with seating for one. Includes Performance and Thrust, plus a full flight system.
              </p>
            </div>

            {/* Financial Summary: Exact Tesla Figures */}
            <div className="space-y-4 pt-6 border-t border-white/10 text-sm">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-base sm:text-lg font-bold text-white">Due Today</div>
                  <div className="text-[11px] font-mono text-white/50">Refundable</div>
                </div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                  $5,000
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <div>
                  <div className="text-base sm:text-lg font-bold text-white">Wire payment due within 10 days</div>
                  <div className="text-[11px] font-mono text-white/50">Refundable</div>
                </div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                  $45,000
                </div>
              </div>
            </div>

            {/* Legal Disclaimers */}
            <div className="mt-6 space-y-2 text-[11px] font-mono text-white/40 leading-relaxed">
              <p>
                Reservations are not final until payment is received, and are subject to cancellation if payment is not completed within 10 days.
              </p>
              <p>
                By reserving, I agree to the <span className="underline hover:text-white cursor-pointer">Roadster Reservation Agreement</span>, <span className="underline hover:text-white cursor-pointer">Terms of Use</span>, and <span className="underline hover:text-white cursor-pointer">Privacy Notice</span>.
              </p>
            </div>

            {/* Payment CTAs: Pay with GPay / Pay with Card */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => handlePayment("gpay")}
                className="w-full py-4 rounded-md border border-white/30 bg-black hover:bg-zinc-900 font-mono text-xs font-bold tracking-[0.2em] uppercase text-white transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Pay with</span>
                <span className="font-sans font-extrabold tracking-normal text-sm">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                  <span className="text-white ml-1">Pay</span>
                </span>
              </button>

              <button
                onClick={() => handlePayment("card")}
                className="w-full py-4 rounded-md border border-white/15 bg-[#1B1B1E] hover:bg-[#25252A] font-mono text-xs font-bold tracking-[0.2em] uppercase text-white transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <CreditCard className="h-4 w-4" />
                <span>Pay with Card</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: OFFICIAL 1:1 SHOWCASE STORY PAGE
  // =========================================================================
  return (
    <div className="min-h-screen bg-black text-[#F4F4F6] font-sans antialiased selection:bg-[#C88A3E] selection:text-black">
      
      {/* ===================================================================== */}
      {/* NAVIGATION HEADER (MINIMALIST GEOMETRIC HEADER)                      */}
      {/* ===================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-mono text-xl sm:text-2xl font-black tracking-[0.35em] text-white uppercase group-hover:text-[#C88A3E] transition-colors">
            X3
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setViewMode("configurator")}
            className="text-xs font-mono tracking-widest uppercase text-[#C88A3E] hover:text-[#E8A554] transition-colors font-bold"
          >
            Reserve Now
          </button>

          <Link
            to="/portal"
            className="hidden sm:inline-flex text-xs font-mono tracking-widest uppercase text-white/70 hover:text-white transition-colors"
          >
            Digital Cockpit
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-widest uppercase text-white/80 hover:text-white border border-white/10 hover:border-white/30 bg-black/40 backdrop-blur-md transition-colors"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* MOBILE / FULLSCREEN MENU DRAWER */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl flex flex-col justify-center items-center gap-8 animate-fadeIn text-center">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="text-2xl sm:text-3xl font-mono tracking-widest uppercase hover:text-[#C88A3E] transition-colors"
          >
            Flagship Home
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false);
              setViewMode("configurator");
            }}
            className="text-2xl sm:text-3xl font-mono tracking-widest uppercase text-[#C88A3E]"
          >
            Reserve Roadster
          </button>
          <Link
            to="/portal"
            onClick={() => setMenuOpen(false)}
            className="text-2xl sm:text-3xl font-mono tracking-widest uppercase hover:text-[#C88A3E] transition-colors"
          >
            In-Car Digital Cockpit
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="mt-8 text-xs font-mono text-white/50 tracking-widest uppercase"
          >
            [ Close Menu ]
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. HERO SECTION: STAGE LIGHT BEAM & ROADSTER TYPOGRAPHY               */}
      {/* ===================================================================== */}
      <section className="relative min-h-screen flex flex-col justify-between items-center text-center px-6 pt-32 pb-16 overflow-hidden">
        
        {/* Background Official Image with Floor Light Beam */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/assets/roadster/official-gallery/1-hero-rear-beam.jpg"
            alt="X3 Roadster Stage"
            className="w-full h-full object-cover object-center filter contrast-125 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* Top Spacer */}
        <div className="relative z-10 w-full" />

        {/* Center: Hero Identity & ROADSTER Champagne Gold Typography */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          
          {/* Custom Champagne Metallic ROADSTER Wordmark */}
          <h1
            className="font-black italic uppercase tracking-[0.18em] text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-transparent bg-clip-text drop-shadow-[0_10px_40px_rgba(0,0,0,0.95)]"
            style={{
              backgroundImage: "linear-gradient(180deg, #F9ECD5 0%, #D8B785 50%, #A27D4C 100%)",
            }}
          >
            ROADSTER
          </h1>

          {/* Action Buttons: Exact Tesla Layout */}
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <button
              onClick={() => setViewMode("configurator")}
              className="w-full sm:w-52 py-3.5 px-6 rounded-md border border-white/25 bg-black/60 hover:bg-black/90 hover:border-white/50 font-mono text-xs font-bold tracking-[0.2em] uppercase text-white backdrop-blur-md transition-all shadow-lg"
            >
              Reserve Now
            </button>
            <button
              onClick={() => setUpdatesModalOpen(true)}
              className="w-full sm:w-52 py-3.5 px-6 rounded-md border border-white/25 bg-black/60 hover:bg-black/90 hover:border-white/50 font-mono text-xs font-bold tracking-[0.2em] uppercase text-white backdrop-blur-md transition-all shadow-lg"
            >
              Get Updates
            </button>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="relative z-10 pt-8 text-[10px] font-mono tracking-[0.25em] uppercase text-white/40 animate-pulse">
          Scroll Down
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. THREE CORE CAPABILITY BADGES (ACTIVE AERO / THRUSTERS / SUCTION)   */}
      {/* ===================================================================== */}
      <section className="py-24 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* Capability 1: Active Aero */}
        <div className="flex flex-col items-center space-y-4 py-8 w-full max-w-sm">
          <div className="h-14 w-14 grid place-items-center text-white/90">
            <Wind className="h-10 w-10 stroke-[1.2]" />
          </div>
          <span className="font-mono text-sm sm:text-base tracking-[0.25em] uppercase text-white font-semibold">
            Active Aero
          </span>
        </div>

        {/* Thin Gold Divider */}
        <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-[#C88A3E]/60 to-transparent" />

        {/* Capability 2: Cold-Gas Thrusters */}
        <div className="flex flex-col items-center space-y-4 py-8 w-full max-w-sm">
          <div className="h-14 w-14 grid place-items-center text-white/90">
            <Flame className="h-10 w-10 stroke-[1.2]" />
          </div>
          <span className="font-mono text-sm sm:text-base tracking-[0.25em] uppercase text-white font-semibold">
            Cold-Gas Thrusters
          </span>
        </div>

        {/* Thin Gold Divider */}
        <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-[#C88A3E]/60 to-transparent" />

        {/* Capability 3: Multi-Mode Suction System */}
        <div className="flex flex-col items-center space-y-4 py-8 w-full max-w-sm">
          <div className="h-14 w-14 grid place-items-center text-white/90">
            <Fan className="h-10 w-10 stroke-[1.2]" />
          </div>
          <span className="font-mono text-sm sm:text-base tracking-[0.25em] uppercase text-white font-semibold">
            Multi-Mode Suction System
          </span>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. A TRUE PILOT'S CAR                                                 */}
      {/* ===================================================================== */}
      <section className="pt-16 pb-28 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="h-12 w-12 grid place-items-center mb-4 text-white">
            <Fan className="h-8 w-8 stroke-[1.2]" />
          </div>
          <div className="text-xs font-mono tracking-[0.25em] uppercase text-white/60 mb-6">
            Multi-Mode Suction System
          </div>

          <h2 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight text-white mb-3">
            A True Pilot's Car
          </h2>
          <div className="w-24 h-[2px] bg-[#C88A3E] mb-8" />

          <p className="max-w-3xl text-sm sm:text-base md:text-lg text-[#B0B3BD] leading-relaxed font-light">
            Roadster can perform at levels unlike any other production car. It goes beyond Plaid to unlock an entirely new dimension of driving. It challenges the limits of design, engineering and physics to deliver an expertly crafted extra-terrestrial vehicle.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl mb-12">
          <img
            src="/assets/roadster/official-gallery/3-true-pilot-profile.jpg"
            alt="Roadster True Pilot Profile"
            className="w-full h-auto object-cover object-center"
          />
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl">
          <img
            src="/assets/roadster/official-gallery/4-wheel-close-up.jpg"
            alt="Roadster Wheel and Trofeo Tire"
            className="w-full h-auto object-cover object-center"
          />
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. HORIZONTAL FEATURE CAROUSEL (5 CARDS WITH AMBER UNDERLINES)        */}
      {/* ===================================================================== */}
      <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-[#0A0A0C] overflow-hidden shadow-2xl">
          <div className="relative w-full aspect-[16/9] max-h-[560px] overflow-hidden bg-black">
            <img
              src={CAROUSEL_SLIDES[activeSlide].image}
              alt={CAROUSEL_SLIDES[activeSlide].title}
              className="w-full h-full object-cover object-center filter contrast-110 brightness-95 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="p-8 sm:p-12 space-y-4">
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {CAROUSEL_SLIDES[activeSlide].title}
              </h3>
              <div className="w-16 h-[2px] bg-[#C88A3E] mt-3" />
            </div>

            <p className="text-sm sm:text-base text-[#A8ABB7] max-w-3xl leading-relaxed font-light">
              {CAROUSEL_SLIDES[activeSlide].copy}
            </p>

            <div className="pt-8 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-lg border border-white/15 hover:border-white/40 bg-black/40 text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-lg border border-white/15 hover:border-white/40 bg-black/40 text-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {CAROUSEL_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2.5 rounded-sm transition-all ${
                      activeSlide === idx
                        ? "w-8 bg-white"
                        : "w-2.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <div className="text-xs font-mono text-white/40">
                0{activeSlide + 1} / 0{CAROUSEL_SLIDES.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. OUT OF THIS WORLD                                                  */}
      {/* ===================================================================== */}
      <section className="py-28 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-black overflow-hidden shadow-2xl mb-12">
          <img
            src="/assets/roadster/official-gallery/10-out-of-this-world-desert.jpg"
            alt="Roadster Under Desert Milky Way"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
            Out of This World
          </h2>
          <div className="w-20 h-[2px] bg-[#C88A3E] mb-6" />

          <p className="text-sm sm:text-base md:text-lg text-[#B0B3BD] leading-relaxed font-light">
            We already put Roadster in a rocket. Now we put a rocket in Roadster. We created a vehicle capable of next-level performance. Additional SpaceX components can transform that road performance into a truly revolutionary experience.
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. BEYOND THE LIMITS OF PHYSICS & DOWNFORCE GRAPH                     */}
      {/* ===================================================================== */}
      <section className="py-28 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-black overflow-hidden shadow-2xl mb-12">
          <img
            src="/assets/roadster/official-gallery/12-downforce-graph.jpg"
            alt="Downforce vs Speed Graph"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
            Beyond The Limits of Physics
          </h2>
          <div className="w-20 h-[2px] bg-[#C88A3E] mb-6" />

          <p className="text-sm sm:text-base md:text-lg text-[#B0B3BD] leading-relaxed font-light">
            Our multi-mode fan and ground sealing system acts as a downforce generator, pulling air out from beneath the vehicle. This provides enough suction to hold the vehicle upside down, even when stationary. Powered fans and active wings maximize traction and cornering speeds in all conditions, achieving massive downforce at zero speed. A next-gen steer-by-wire system offers incredible feedback in various road conditions. Activate Track Mode to lower the car and transform the suspension. High downforce or low drag modes can then be used as needed on the track.<sup>†</sup>
          </p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. SUCTION INVERTED CEILING & DUAL PLUME THRUSTERS                    */}
      {/* ===================================================================== */}
      <section className="py-28 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-black overflow-hidden shadow-2xl mb-12">
          <img
            src="/assets/roadster/official-gallery/16-dual-plume-full.jpg"
            alt="Roadster Inverted Ceiling Suction and Cold-Gas Plumes"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
            Gravity Defying
          </h2>
          <div className="w-20 h-[2px] bg-[#C88A3E] mb-6" />

          <p className="text-sm sm:text-base md:text-lg text-[#B0B3BD] leading-relaxed font-light">
            Advanced cold-gas thrusters use all-electric actuators to offer precise thrust, completing micro adjustments within a fraction of a second. This helps stabilize the vehicle in flight.<sup>†</sup>
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-black overflow-hidden shadow-2xl">
          <img
            src="/assets/roadster/official-gallery/18-rear-wing-red-glow.jpg"
            alt="Rear Wing Red Illumination and Thruster Ports"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. CONFIGURATIONS & AUGMENTS (DIRECT ROUTE TO CONFIGURATOR)           */}
      {/* ===================================================================== */}
      <section className="py-28 px-6 sm:px-12 max-w-4xl mx-auto">
        <div className="border-b border-white/15 pb-16 mb-16">
          <h2 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight text-white mb-2">
            Performance
          </h2>
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#C88A3E] mb-6 font-semibold">
            By Reservation
          </div>
          <p className="text-sm sm:text-base md:text-lg text-[#B0B3BD] leading-relaxed font-light max-w-3xl">
            Road ready with seating for two. Features active aerodynamics and a multi-mode suction system that maximizes downforce for next-level performance on and off the track.
          </p>

          <button
            onClick={() => {
              setSelectedTrim("performance");
              setViewMode("configurator");
            }}
            className="mt-8 px-8 py-3 rounded-md border border-white/20 bg-white/5 hover:bg-white/15 font-mono text-xs font-bold tracking-[0.2em] uppercase text-white transition-all"
          >
            Configure Performance
          </button>
        </div>

        <div className="text-center mb-16">
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-white/50">
            Augments
          </span>
        </div>

        <div className="rounded-2xl border border-white/15 bg-[#090A0D] p-8 sm:p-12 mb-8 shadow-xl">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Thrust
          </h3>
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#C88A3E] mb-6 font-semibold">
            Limited Release
          </div>
          <p className="text-sm sm:text-base text-[#B0B3BD] leading-relaxed font-light mb-8">
            Race ready with seating for two. Features a multi-mode suction system paired with cold-gas thrusters in the rear of the vehicle that propel Roadster from 0-60 in under 1 second.
          </p>

          <button
            onClick={() => {
              setSelectedTrim("thrust");
              setViewMode("configurator");
            }}
            className="px-8 py-3 rounded-md border border-white/20 bg-white/10 hover:bg-white/20 font-mono text-xs font-bold tracking-[0.2em] uppercase text-white transition-all"
          >
            Configure Thrust Augment
          </button>
        </div>

        <div className="rounded-2xl border border-white/15 bg-[#090A0D] p-8 sm:p-12 shadow-xl">
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Rocket
          </h3>
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#C88A3E] mb-6 font-semibold">
            Invite Only
          </div>
          <p className="text-sm sm:text-base text-[#B0B3BD] leading-relaxed font-light mb-8">
            Air ready with seating for one. Features a multi-mode suction system paired with cold-gas thrusters positioned around the perimeter of the vehicle that support forward and upward acceleration as well as lateral rotational movement. So yes, it can fly.<sup>†</sup>
          </p>

          <button
            onClick={() => {
              setSelectedTrim("rocket");
              setViewMode("configurator");
            }}
            className="px-8 py-3 rounded-md border border-[#C88A3E]/40 bg-[#C88A3E]/10 hover:bg-[#C88A3E]/20 font-mono text-xs font-bold tracking-[0.2em] uppercase text-[#F9ECD5] transition-all"
          >
            Apply for Rocket Augment
          </button>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. REAL 3D INTERACTIVE DIGITAL TWIN DRAWER TOGGLE                     */}
      {/* ===================================================================== */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center border-t border-white/10">
        <button
          onClick={() => setShow3DDigitalTwin(!show3DDigitalTwin)}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 font-mono text-xs uppercase tracking-widest text-white transition-all"
        >
          <span>{show3DDigitalTwin ? "Hide 3D Digital Twin" : "Open Interactive 3D Digital Twin"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {show3DDigitalTwin && (
          <div className="mt-8 rounded-3xl border border-white/15 bg-black/90 p-6 sm:p-8 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 text-xs font-mono">
              <span className="text-white/60">Drag to rotate 360&deg; &middot; Wheels in active motion</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDriving3D(!isDriving3D)}
                  className="px-3 py-1 rounded border border-white/20 text-[10px] text-white/80"
                >
                  {isDriving3D ? "Pause Spin" : "Resume Spin"}
                </button>
                <button
                  onClick={testThrusters}
                  className="px-3 py-1 rounded bg-red-600/30 border border-red-500/50 text-[10px] text-red-300 font-bold"
                >
                  Fire Thrusters
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-[16/9] max-h-[500px] rounded-2xl overflow-hidden bg-black/90">
              <TeslaVehicle3DCanvas
                model="roadster"
                isDriving={isDriving3D}
                speed={thrusterActive ? 180 : 74}
                thrusterFiring={thrusterActive}
                headlightsOn={true}
              />
            </div>
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 10. SEE FOR YOURSELF & FINAL CTA                                      */}
      {/* ===================================================================== */}
      <section className="pt-24 pb-32 px-6 sm:px-12 max-w-6xl mx-auto text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight text-white mb-3">
            See For Yourself
          </h2>
          <div className="w-20 h-[2px] bg-[#C88A3E] mx-auto mb-6" />
          <p className="text-sm sm:text-base font-mono text-[#B0B3BD] tracking-wider uppercase">
            Feat of strength: complete.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-black overflow-hidden shadow-2xl mb-12">
          <div className="absolute top-10 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <span
              className="font-black italic uppercase tracking-[0.18em] text-3xl sm:text-5xl md:text-6xl text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(180deg, #F9ECD5 0%, #D8B785 50%, #A27D4C 100%)",
              }}
            >
              ROADSTER
            </span>
          </div>

          <img
            src="/assets/roadster/official-gallery/23-final-reserve-car.jpg"
            alt="Roadster Final Showcase"
            className="w-full h-auto object-cover"
          />

          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <button
              onClick={() => setViewMode("configurator")}
              className="py-3.5 px-10 rounded-md border border-white/30 bg-black/75 hover:bg-black/95 font-mono text-xs font-bold tracking-[0.2em] uppercase text-white backdrop-blur-md transition-all shadow-2xl"
            >
              Reserve Now
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-3 text-[11px] font-mono text-white/40 leading-relaxed pt-8">
          <p>
            <sup>†</sup> Available with the Rocket trim only, which is not available in all regions.
          </p>
          <p>
            The features and specifications indicated on this page are reflective of our Thrust augment only and are available as an optional upgrade.
          </p>
          <div className="pt-6 text-white/30">
            X3 &copy; 2026 &nbsp;&middot;&nbsp; Privacy &amp; Legal
          </div>
        </div>
      </section>

      {/* UPDATES MODAL */}
      {updatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-[#0C0D10] p-8 shadow-2xl">
            <button
              onClick={() => setUpdatesModalOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white text-lg font-mono"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">Get Updates</h3>
            <p className="text-xs text-white/60 mb-6">Receive engineering milestones and delivery schedule alerts.</p>
            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-lg border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-[#C88A3E] focus:outline-none mb-4"
            />
            <button
              onClick={() => {
                alert("Subscribed for Roadster program alerts.");
                setUpdatesModalOpen(false);
              }}
              className="w-full rounded-lg bg-white text-black font-mono font-bold text-xs uppercase tracking-widest py-3 hover:bg-white/90 transition-all"
            >
              Subscribe
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
