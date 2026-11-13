import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Car,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Download,
  Bell,
  MapPin,
  Zap,
  Gauge,
  Wifi,
  ChevronRight,
  LogOut,
  Sliders,
  ExternalLink,
  Smartphone,
  Lock,
  Unlock,
  ArrowRight,
  Sparkles,
  Radio,
  Flame,
  Key,
  Eye,
  Check,
  Layers,
  Activity,
  Crosshair,
  FileText,
  Volume2,
  VolumeX,
  ShoppingCart,
  PlusCircle,
  Cpu,
  RefreshCw,
  Terminal,
  Compass,
  AlertTriangle,
  Fan,
  Navigation,
  BatteryCharging,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Play,
  Pause,
  RotateCw,
  Video,
  Camera,
  Music,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  SlidersVertical,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { TeslaVehicle3DCanvas } from "@/components/tesla-vehicle-3d-canvas";
import { X3Logo3D } from "@/components/x3-logo-3d";

export const Route = createFileRoute("/portal")({
  component: CustomerPortalPage,
  head: () => ({
    meta: [
      { title: "Tesla & Cybertruck In-Car Touchscreen — Model-Specific Digital Cockpit" },
      {
        name: "description",
        content: "Futuristic in-car touchscreen dashboard tailored specifically for Cybertruck and Roadster Founders Series without static photos.",
      },
    ],
  }),
});

function playTeslaHaptic(type: "click" | "gear" | "fsd" | "thruster" | "locker") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.frequency.setValueAtTime(650, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "gear") {
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.setValueAtTime(700, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "fsd") {
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "thruster") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "locker") {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(200, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {}
}

export function CustomerPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState("pilot@x3.engineering");
  const [passwordInput, setPasswordInput] = useState("X3Roadster2026!");
  const [authError, setAuthError] = useState("");

  // VEHICLE SELECTOR: "cybertruck" vs "roadster"
  const [activeModel, setActiveModel] = useState<"cybertruck" | "roadster">("cybertruck");

  // SHARED TELEMETRY
  const [gear, setGear] = useState<"P" | "R" | "N" | "D">("D");
  const [speed, setSpeed] = useState(74);
  const [isDriving, setIsDriving] = useState(true);
  const [fsdActive, setFsdActive] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [headlights, setHeadlights] = useState<"off" | "auto" | "high">("auto");

  // CYBERTRUCK SPECIFIC STATE
  const [cyberHeight, setCyberHeight] = useState<"Entry" | "Low" | "Medium" | "High" | "Extract">("Medium");
  const [vaultCover, setVaultCover] = useState<"closed" | "opening" | "open">("closed");
  const [wadeMode, setWadeMode] = useState(false);
  const [rearLocker, setRearLocker] = useState(false);
  const [steerAngle, setSteerAngle] = useState(0);

  // ROADSTER SPECIFIC STATE
  const [rocketMode, setRocketMode] = useState(false);
  const [thrusterPSI, setThrusterPSI] = useState(10000);
  const [aeroWingAngle, setAeroWingAngle] = useState(12);
  const [gForceLateral, setGForceLateral] = useState(0.42);
  const [launchTimer, setLaunchTimer] = useState("1.10s");
  const [thrusterFiring, setThrusterFiring] = useState(false);

  // APP DRAWER / MODAL
  const [activeApp, setActiveApp] = useState<"none" | "controls" | "upgrades" | "charging" | "music">("none");

  // CLIMATE
  const [driverTemp, setDriverTemp] = useState(68);
  const [passengerTemp, setPassengerTemp] = useState(68);

  // MEDIA
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [volume, setVolume] = useState(75);

  // NOTIFICATION
  const [hudAlert, setHudAlert] = useState<string | null>(null);

  // ROAD ANIMATION
  const [roadOffset, setRoadOffset] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      if (localStorage.getItem("x3_pilot_authenticated") === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Continuous road and steering simulation
  useEffect(() => {
    let anim: number;
    let t = 0;
    const loop = () => {
      if (isDriving && gear === "D") {
        setRoadOffset((prev) => (prev + 3.5) % 40);
        t += 0.03;
        setSteerAngle(Math.sin(t) * 8); // Subtle natural road steering
      }
      anim = requestAnimationFrame(loop);
    };
    anim = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(anim);
  }, [isDriving, gear]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (emailInput.trim().length > 3 && passwordInput.length > 4) {
      playTeslaHaptic("fsd");
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("x3_pilot_authenticated", "true");
      }
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      playTeslaHaptic("click");
      setAuthError("Please enter valid credentials.");
    }
  };

  const handleQuickDemoLogin = () => {
    playTeslaHaptic("fsd");
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("x3_pilot_authenticated", "true");
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    playTeslaHaptic("click");
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("x3_pilot_authenticated");
    }
    setIsAuthenticated(false);
  };

  const shiftGear = (newGear: "P" | "R" | "N" | "D") => {
    playTeslaHaptic("gear");
    setGear(newGear);
    if (newGear === "P") {
      setSpeed(0);
      setIsDriving(false);
      setHudAlert("PARK ENGAGED · EMERGENCY BRAKE SET");
    } else if (newGear === "D") {
      setSpeed(activeModel === "roadster" ? 85 : 72);
      setIsDriving(true);
      setHudAlert("DRIVE ENGAGED · FSD HIGHWAY AUTONOMY READY");
    } else if (newGear === "R") {
      setSpeed(5);
      setIsDriving(true);
      setHudAlert("REVERSE · REAR RADAR ACTIVE");
    }
    setTimeout(() => setHudAlert(null), 3000);
  };

  const triggerColdGasPurge = () => {
    playTeslaHaptic("thruster");
    setThrusterFiring(true);
    setHudAlert("🚀 COLD-GAS THRUSTERS: 10,000 PSI REACTION PULSE FIRED");
    setTimeout(() => {
      setThrusterFiring(false);
      setHudAlert(null);
    }, 3500);
  };

  const toggleVault = () => {
    playTeslaHaptic("locker");
    setVaultCover((prev) => (prev === "closed" ? "open" : "closed"));
    setHudAlert(vaultCover === "closed" ? "MOTORIZED VAULT OPENING..." : "MOTORIZED VAULT SEALED");
    setTimeout(() => setHudAlert(null), 3000);
  };

  // =========================================================================
  // AUTHENTICATION SCREEN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-[#E82127] selection:text-white">
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 mb-2">
                <X3Logo3D size="md" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
                Tesla In-Car System
              </h1>
              <p className="text-xs text-white/50 font-mono">
                Model-Specific Digital Cockpit Touchscreen Architecture
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-4 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-white/70">
                <span className="font-bold flex items-center gap-1.5 text-[#E82127]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>OFFICIAL PILOT ACCESS</span>
                </span>
                <span className="text-[10px] text-emerald-400">Ready</span>
              </div>
              <div className="text-[11px] text-white/80 space-y-1">
                <div>Email: <span className="text-white font-bold select-all">pilot@x3.engineering</span></div>
                <div>Pass: <span className="text-white font-bold select-all">X3Roadster2026!</span></div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1">
                  Driver Account Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#161616] px-4 py-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#161616] px-4 py-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                  required
                />
              </div>

              {authError && <div className="text-xs font-mono text-[#E82127]">{authError}</div>}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#3E6AE1] hover:bg-[#3457B2] py-3 text-sm font-semibold text-white transition-colors"
              >
                Enter Digital Cockpit
              </button>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 py-3 text-xs font-mono font-bold text-white transition-colors"
              >
                One-Click Instant Pilot Access
              </button>
            </form>

            <div className="text-center pt-4">
              <Link to="/" className="text-xs text-white/50 hover:text-white transition-colors">
                ← Return to X3 Flagship
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODEL-SPECIFIC FUTURISTIC DIGITAL TOUCHSCREEN
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#040406] text-white flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 lg:p-8 select-none font-sans overflow-x-hidden">
      
      {/* 18.5" TABLET BEZEL CONTAINER */}
      <div
        className={`relative w-full max-w-[1540px] aspect-[16/9] min-h-[760px] rounded-[36px] sm:rounded-[44px] border-[12px] sm:border-[16px] shadow-[0_30px_100px_rgba(0,0,0,0.98)] flex flex-col justify-between overflow-hidden transition-all duration-700 ${
          activeModel === "cybertruck"
            ? "border-[#22242B] bg-[#0A0B0E]"
            : "border-[#1A181C] bg-[#070609]"
        }`}
      >
        {/* Bezel Interior Chamfer Highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-[24px] border border-white/10 shadow-inner z-30" />

        {/* =================================================================== */}
        {/* TOP COCKPIT STATUS BAR                                              */}
        {/* =================================================================== */}
        <div
          className={`relative z-20 h-14 border-b px-6 flex items-center justify-between text-xs font-mono transition-colors duration-500 ${
            activeModel === "cybertruck"
              ? "border-[#2A2D38] bg-[#0E1015]/90 text-[#D8DAE2]"
              : "border-white/10 bg-black/90 text-white"
          }`}
        >
          {/* Top Left: PRND Strip + Speedometer */}
          <div className="flex items-center gap-6">
            
            {/* PRND Gear Selector */}
            <div className="flex items-center gap-1.5 font-bold text-sm">
              {(["P", "R", "N", "D"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => shiftGear(g)}
                  className={`w-7 h-7 rounded-lg grid place-items-center transition-all ${
                    gear === g
                      ? activeModel === "cybertruck"
                        ? "bg-[#E6A020] text-black font-black shadow-md shadow-[#E6A020]/30"
                        : "bg-white text-black font-black shadow-md"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-white/20" />

            {/* Speedometer */}
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
                  {speed}
                </span>
                <span className="text-[10px] text-white/50 uppercase font-mono">MPH</span>
              </div>

              {/* Speed Limit Sign */}
              <div className="w-7 h-7 rounded-md border-2 border-red-500 bg-white grid place-items-center text-black font-black text-[10px]">
                65
              </div>

              {/* Autopilot / FSD Status */}
              <button
                onClick={() => {
                  playTeslaHaptic("fsd");
                  setFsdActive(!fsdActive);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono transition-all ${
                  fsdActive
                    ? activeModel === "cybertruck"
                      ? "bg-[#E6A020] text-black shadow-[0_0_12px_rgba(230,160,32,0.6)]"
                      : "bg-[#3E6AE1] text-white shadow-[0_0_12px_rgba(62,106,225,0.8)]"
                    : "bg-white/10 text-white/40"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>{fsdActive ? "FSD SUPERVISED" : "MANUAL DRIVER"}</span>
              </button>
            </div>
          </div>

          {/* Top Center: MODEL SWITCHER (CYBERTRUCK vs ROADSTER) */}
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 p-1 text-xs">
            <button
              onClick={() => {
                playTeslaHaptic("click");
                setActiveModel("cybertruck");
              }}
              className={`rounded-full px-4 py-1.5 font-bold transition-all ${
                activeModel === "cybertruck"
                  ? "bg-[#E6A020] text-black shadow-md shadow-[#E6A020]/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              📐 Cybertruck Cyberbeast
            </button>
            <button
              onClick={() => {
                playTeslaHaptic("click");
                setActiveModel("roadster");
              }}
              className={`rounded-full px-4 py-1.5 font-bold transition-all ${
                activeModel === "roadster"
                  ? "bg-gradient-to-r from-[#E82127] to-[#B31419] text-white shadow-md shadow-[#E82127]/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              🚀 Founders Roadster
            </button>
          </div>

          {/* Top Right: Battery, Starlink, Clock */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <BatteryCharging className="h-4 w-4 text-emerald-400" />
              <span>{activeModel === "cybertruck" ? "88%" : "98%"}</span>
              <span className="text-white/40 font-normal">
                ({activeModel === "cybertruck" ? "340 mi" : "620 mi"})
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-white/70">
              <span className="flex items-center gap-1 text-[11px]">
                <Wifi className="h-3.5 w-3.5 text-blue-400" />
                <span>Starlink</span>
              </span>
              <span>72°F</span>
              <span>12:56 AM</span>
            </div>

            <button onClick={handleLogout} className="text-white/40 hover:text-white text-[11px] font-mono ml-2">
              Exit
            </button>
          </div>
        </div>

        {/* HUD ALERT TOAST */}
        {hudAlert && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 rounded-full border border-white/20 bg-black/95 px-6 py-2 text-xs font-mono text-white shadow-2xl backdrop-blur-xl animate-fadeIn flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#E82127]" />
            <span>{hudAlert}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* MAIN SPLIT VIEWPORT                                                */}
        {/* =================================================================== */}
        <div className="relative flex-1 w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* ================================================================= */}
          {/* LEFT 6 COLUMNS: MODEL-SPECIFIC PROCEDURAL DIGITAL TWIN            */}
          {/* ================================================================= */}
          <div
            className={`lg:col-span-6 relative border-r p-6 flex flex-col justify-between overflow-hidden transition-colors duration-700 ${
              activeModel === "cybertruck"
                ? "border-[#2A2D38] bg-gradient-to-b from-[#0F1117] via-[#14161F] to-[#0A0B0E]"
                : "border-white/10 bg-gradient-to-b from-[#0B090F] via-[#110D17] to-[#060508]"
            }`}
          >
            {/* Real-Time Perspective Road Canvas */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-60">
              <svg className="w-full h-full" viewBox="0 0 500 700">
                <defs>
                  <linearGradient id="cyberRoad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1B1E28" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#252936" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                <polygon points="180,100 320,100 490,700 10,700" fill="url(#cyberRoad)" />
                <line x1="180" y1="100" x2="10" y2="700" stroke="#424759" strokeWidth="3" />
                <line x1="320" y1="100" x2="490" y2="700" stroke="#424759" strokeWidth="3" />

                {/* Animated FSD Center Path */}
                <line
                  x1="250"
                  y1="100"
                  x2="250"
                  y2="700"
                  stroke={activeModel === "cybertruck" ? "#E6A020" : "#3E6AE1"}
                  strokeWidth="5"
                  strokeDasharray="30 20"
                  strokeDashoffset={-roadOffset}
                />
              </svg>
            </div>

            {/* Top Vehicle Telemetry Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/70 border border-white/15 px-3 py-1 text-[11px] font-mono">
                <span
                  className={`h-2 w-2 rounded-full animate-ping ${
                    activeModel === "cybertruck" ? "bg-[#E6A020]" : "bg-[#E82127]"
                  }`}
                />
                <span className="font-bold text-white">
                  {activeModel === "cybertruck"
                    ? "CYBER TRUCK STEER-BY-WIRE HW4"
                    : "ROADSTER FOUNDERS SPACEX AERO PACK"}
                </span>
              </div>

              <div className="text-[10px] font-mono text-white/50">
                {activeModel === "cybertruck" ? "VIN: 7G2CE1E38RA009412" : "VIN: 5YJSA1E26PF904288"}
              </div>
            </div>

            {/* =============================================================== */}
            {/* REAL THREE.JS WEBGL INTERACTIVE 3D VEHICLE DIGITAL TWIN         */}
            {/* =============================================================== */}
            <div className="relative z-10 my-auto w-full flex flex-col items-center justify-center">
              {/* 3D Model Header Identification */}
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                    activeModel === "cybertruck" ? "bg-[#E6A020] text-black" : "bg-[#E82127] text-white"
                  }`}>
                    {activeModel === "cybertruck" ? "TESLA CYBERTRUCK" : "TESLA ROADSTER"}
                  </span>
                  <span className="text-white font-bold font-sans text-sm">
                    {activeModel === "cybertruck" ? "Cyberbeast Tri-Motor" : "Founders Series SpaceX Package"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  REAL-TIME 3D ROTATION
                </span>
              </div>

              {/* Real 3D Interactive WebGL Canvas */}
              <div className="relative w-full aspect-[16/10] max-h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl">
                <TeslaVehicle3DCanvas
                  model={activeModel}
                  isDriving={isDriving}
                  speed={speed}
                  thrusterFiring={thrusterFiring}
                  headlightsOn={headlights !== "off"}
                  vaultOpen={vaultCover === "open"}
                />
              </div>

              {/* Model-Specific Quick Dynamic Telemetry Bar */}
              {activeModel === "cybertruck" ? (
                <div className="w-full mt-4 grid grid-cols-3 gap-2 text-xs font-mono">
                  <button
                    onClick={toggleVault}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-center"
                  >
                    <span className="text-[10px] text-white/40 block">VAULT COVER</span>
                    <span className="font-bold text-[#E6A020] uppercase">{vaultCover}</span>
                  </button>

                  <button
                    onClick={() => {
                      playTeslaHaptic("locker");
                      setRearLocker(!rearLocker);
                      setHudAlert(rearLocker ? "REAR LOCKER DISENGAGED" : "REAR E-LOCKER ENGAGED");
                      setTimeout(() => setHudAlert(null), 3000);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      rearLocker
                        ? "border-[#E6A020] bg-[#E6A020]/20 text-[#E6A020]"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    <span className="text-[10px] text-white/40 block">REAR LOCKER</span>
                    <span className="font-bold uppercase">{rearLocker ? "LOCKED" : "OPEN"}</span>
                  </button>

                  <button
                    onClick={() => {
                      playTeslaHaptic("locker");
                      setWadeMode(!wadeMode);
                      setHudAlert(wadeMode ? "WADE MODE DEACTIVATED" : "WADE MODE: PACK PRESSURIZED");
                      setTimeout(() => setHudAlert(null), 3000);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      wadeMode
                        ? "border-blue-400 bg-blue-400/20 text-blue-400"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    <span className="text-[10px] text-white/40 block">WADE MODE</span>
                    <span className="font-bold uppercase">{wadeMode ? "ACTIVE" : "OFF"}</span>
                  </button>
                </div>
              ) : (
                <div className="w-full mt-4 grid grid-cols-3 gap-2 text-xs font-mono">
                  <button
                    onClick={triggerColdGasPurge}
                    className="p-3 rounded-xl border border-[#E82127]/50 bg-[#E82127]/15 hover:bg-[#E82127]/30 text-center"
                  >
                    <span className="text-[10px] text-white/40 block">SPACEX THRUSTER</span>
                    <span className="font-bold text-[#E82127] uppercase">PURGE 10K PSI</span>
                  </button>

                  <button
                    onClick={() => {
                      playTeslaHaptic("thruster");
                      setRocketMode(!rocketMode);
                      setAeroWingAngle(rocketMode ? 12 : 32);
                      setHudAlert(rocketMode ? "STANDARD AERO ACTIVE" : "ROCKET LAUNCH MODE READY (1.1s)");
                      setTimeout(() => setHudAlert(null), 3000);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      rocketMode
                        ? "border-[#E82127] bg-[#E82127] text-white shadow-[0_0_15px_rgba(232,33,39,0.8)]"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    <span className="text-[10px] text-white/40 block">ROCKET MODE</span>
                    <span className="font-bold uppercase">{rocketMode ? "ARMED 1.1S" : "READY"}</span>
                  </button>

                  <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
                    <span className="text-[10px] text-white/40 block">G-FORCE LATERAL</span>
                    <span className="font-bold text-emerald-400">+{gForceLateral} G</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Steer & Height Bar */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono bg-black/70 p-3 rounded-2xl border border-white/10">
              <div>
                <span className="text-white/40">AIR SUSPENSION: </span>
                <span className="font-bold text-white uppercase">{activeModel === "cybertruck" ? cyberHeight : "TRACK LOW (100mm)"}</span>
              </div>
              <div>
                <span className="text-white/40">STEER-BY-WIRE: </span>
                <span className="font-bold text-emerald-400">170:1 VARIABLE RATIO</span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT 6 COLUMNS: TESLA LIVE SATELLITE MAP & IN-CAR APPS          */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 relative bg-[#090A0E] flex flex-col justify-between overflow-hidden">
            
            {/* Topographic Tactical Vector Map */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#2c3245_1px,transparent_1px)] [background-size:22px_22px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#090A0E] via-transparent to-[#10141D]" />
            </div>

            {/* Top Navigation Turn Card */}
            <div className="relative z-10 m-6 p-4 rounded-2xl border border-white/15 bg-black/85 backdrop-blur-xl max-w-sm shadow-2xl space-y-2">
              <div className="flex items-start gap-3">
                <div
                  className={`h-9 w-9 rounded-xl text-white grid place-items-center font-bold ${
                    activeModel === "cybertruck" ? "bg-[#E6A020] text-black" : "bg-[#3E6AE1]"
                  }`}
                >
                  <ArrowUp className="h-5 w-5" />
                </div>
                <div className="flex-1 font-mono">
                  <div className="text-sm font-bold text-white font-sans">
                    In 1.4 miles, merge onto Gigafactory Way
                  </div>
                  <div className="text-xs text-white/50">
                    Navigating to Tesla Austin Gigasite Delivery Hub
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">14 min · 11.2 mi</span>
                <span className="text-white/50">Arrive with {activeModel === "cybertruck" ? "84%" : "92%"}</span>
              </div>
            </div>

            {/* Active Modal / App Drawer Overlay over Map */}
            {activeApp !== "none" && (
              <div className="relative z-20 mx-6 mb-6 rounded-3xl border border-white/20 bg-[#121318]/95 p-6 backdrop-blur-2xl shadow-2xl animate-fadeIn space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="text-sm font-bold font-sans uppercase tracking-wider text-white flex items-center gap-2">
                    {activeApp === "controls" && <><Sliders className="h-4 w-4 text-[#E82127]" /> Chassis & Vehicle Controls</>}
                    {activeApp === "upgrades" && <><ShoppingCart className="h-4 w-4 text-[#3E6AE1]" /> Tesla In-Car Upgrades Store</>}
                    {activeApp === "charging" && <><Zap className="h-4 w-4 text-emerald-400" /> Supercharging & Battery Ring</>}
                    {activeApp === "music" && <><Music className="h-4 w-4 text-purple-400" /> Media & Streaming</>}
                  </div>
                  <button
                    onClick={() => setActiveApp("none")}
                    className="text-white/60 hover:text-white font-mono text-xs px-2 py-1 rounded bg-white/5"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* APP 1: UPGRADES STORE (PURCHASABLE IN REAL TIME) */}
                {activeApp === "upgrades" && (
                  <div className="space-y-3 font-mono text-xs max-h-72 overflow-y-auto pr-2 scrollbar-none">
                    <div className="text-white/60 mb-1">
                      Available software & hardware calibrations for {activeModel.toUpperCase()}:
                    </div>

                    {[
                      {
                        title: "SpaceX Cold-Gas Thruster Package",
                        badge: "0-60 IN 1.1S",
                        price: 25000,
                        specs: "1.9s → 1.1s Rocket Launch Mode",
                        installed: activeModel === "roadster" && rocketMode,
                      },
                      {
                        title: "Full Self-Driving (Supervised) HW5",
                        badge: "AUTOPILOT V13",
                        price: 8000,
                        specs: "Level 2 → Supervised FSD",
                        installed: fsdActive,
                      },
                      {
                        title: "Bed-Mounted 50 kWh Range Extender",
                        badge: "470+ MI RANGE",
                        price: 16000,
                        specs: "340 mi → 470 mi Total Range",
                        installed: false,
                      },
                      {
                        title: "Carbon-Ceramic Matrix Track Brakes",
                        badge: "ZERO FADE",
                        price: 8500,
                        specs: "285 ft → 215 ft 100-0 MPH",
                        installed: false,
                      },
                    ].map((upg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/5"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-sans">{upg.title}</span>
                            <span className="text-[10px] text-[#E82127] font-bold">{upg.badge}</span>
                          </div>
                          <div className="text-white/50 text-[11px] mt-0.5">{upg.specs}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">${upg.price.toLocaleString()}</span>
                          {upg.installed ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg font-bold">
                              Installed
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                playTeslaHaptic("fsd");
                                setHudAlert(`✓ ${upg.title} Installed on VIN!`);
                                setTimeout(() => setHudAlert(null), 3500);
                              }}
                              className="rounded-lg bg-[#3E6AE1] hover:bg-[#3457B2] px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
                            >
                              Buy Upgrade
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* APP 2: QUICK CHASSIS CONTROLS */}
                {activeApp === "controls" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <button
                      onClick={() => setIsLocked(!isLocked)}
                      className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left space-y-1"
                    >
                      <Lock className="h-5 w-5 text-white mb-2" />
                      <div className="font-bold text-white">Chassis Lock</div>
                      <div className="text-white/40">{isLocked ? "Locked" : "Unlocked"}</div>
                    </button>

                    <button
                      onClick={() => setHeadlights(headlights === "auto" ? "high" : "auto")}
                      className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left space-y-1"
                    >
                      <Sparkles className="h-5 w-5 text-yellow-400 mb-2" />
                      <div className="font-bold text-white">Matrix Lights</div>
                      <div className="text-white/40 uppercase">{headlights}</div>
                    </button>

                    {activeModel === "cybertruck" ? (
                      <button
                        onClick={toggleVault}
                        className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left space-y-1"
                      >
                        <ShieldCheck className="h-5 w-5 text-[#E6A020] mb-2" />
                        <div className="font-bold text-white">Vault Cover</div>
                        <div className="text-white/40 uppercase">{vaultCover}</div>
                      </button>
                    ) : (
                      <button
                        onClick={triggerColdGasPurge}
                        className="p-4 rounded-2xl border border-[#E82127]/40 bg-[#E82127]/10 hover:bg-[#E82127]/20 text-left space-y-1"
                      >
                        <Flame className="h-5 w-5 text-[#E82127] mb-2" />
                        <div className="font-bold text-white">Thruster Purge</div>
                        <div className="text-white/40">10,000 PSI</div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        playTeslaHaptic("gear");
                        setHudAlert("Mirror Auto-Tilt & Folding Calibrated");
                        setTimeout(() => setHudAlert(null), 3000);
                      }}
                      className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left space-y-1"
                    >
                      <Sliders className="h-5 w-5 text-blue-400 mb-2" />
                      <div className="font-bold text-white">Mirrors & Yoke</div>
                      <div className="text-white/40">Calibrated</div>
                    </button>
                  </div>
                )}

                {/* APP 3: CHARGING */}
                {activeApp === "charging" && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <div>
                        <div className="text-base font-bold text-white">
                          Battery: {activeModel === "cybertruck" ? "88%" : "98%"}
                        </div>
                        <div className="text-white/50">
                          {activeModel === "cybertruck" ? "340 mi range" : "620 mi range"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">V4 Supercharging (350 kW)</span>
                        <div className="text-[10px] text-white/40">+240 miles in 15 min</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Daily Charge Limit</span>
                        <span className="text-white font-bold">90%</span>
                      </div>
                      <input type="range" min="50" max="100" defaultValue="90" className="w-full accent-white" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* BOTTOM CYBER DOCK BAR                                               */}
        {/* =================================================================== */}
        <div
          className={`relative z-20 h-16 border-t px-6 flex items-center justify-between text-xs font-mono transition-colors duration-500 ${
            activeModel === "cybertruck"
              ? "border-[#2A2D38] bg-[#0C0E14] text-[#D8DAE2]"
              : "border-white/10 bg-black text-white"
          }`}
        >
          {/* Left: Quick Car Controls & Driver Climate */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playTeslaHaptic("click");
                setActiveApp(activeApp === "controls" ? "none" : "controls");
              }}
              className={`p-2.5 rounded-2xl border transition-all ${
                activeApp === "controls"
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
              title="Car Controls"
            >
              <Car className="h-5 w-5" />
            </button>

            {/* Driver Temp */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 border border-white/10 px-3 py-1.5">
              <button onClick={() => setDriverTemp(driverTemp - 1)} className="text-white/40 hover:text-white">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-sm text-white">{driverTemp}°</span>
              <button onClick={() => setDriverTemp(driverTemp + 1)} className="text-white/40 hover:text-white">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Center Apps: Upgrades Shop, Charging, Music */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playTeslaHaptic("click");
                setActiveApp(activeApp === "upgrades" ? "none" : "upgrades");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
                activeApp === "upgrades"
                  ? "border-[#3E6AE1] bg-[#3E6AE1] text-white shadow-[0_0_15px_rgba(62,106,225,0.8)]"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <ShoppingCart className="h-4 w-4 text-[#E82127]" />
              <span className="font-bold">Upgrades Store</span>
            </button>

            <button
              onClick={() => {
                playTeslaHaptic("click");
                setActiveApp(activeApp === "charging" ? "none" : "charging");
              }}
              className={`p-2.5 rounded-2xl border transition-all ${
                activeApp === "charging"
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <Zap className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                playTeslaHaptic("click");
                setActiveApp(activeApp === "music" ? "none" : "music");
              }}
              className={`p-2.5 rounded-2xl border transition-all ${
                activeApp === "music"
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <Music className="h-4 w-4" />
            </button>
          </div>

          {/* Right: Passenger Temp & Volume */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-2xl bg-white/5 border border-white/10 px-3 py-1.5">
              <button onClick={() => setPassengerTemp(passengerTemp - 1)} className="text-white/40 hover:text-white">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-sm text-white">{passengerTemp}°</span>
              <button onClick={() => setPassengerTemp(passengerTemp + 1)} className="text-white/40 hover:text-white">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-white/60" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-16 accent-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Return Link Under Touchscreen */}
      <div className="mt-4 flex items-center justify-between w-full max-w-[1540px] px-4 text-xs font-mono text-white/40">
        <Link to="/" className="hover:text-white transition-colors">
          ← Return to X3 Flagship
        </Link>
        <span>Zero Static Photos · 100% Procedural Digital Twin & Vector HUD</span>
      </div>
    </div>
  );
}
