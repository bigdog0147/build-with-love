import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Zap, Gauge, Wind, ChevronRight, Menu, X, Check, ArrowRight, Play } from "lucide-react";
import { TeslaConfiguratorModal } from "@/components/tesla-configurator-modal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/model-3")({
  component: Model3Page,
  head: () => ({
    meta: [
      { title: "Model 3 | X3" },
      {
        name: "description",
        content: "Model 3 sports electric sedan. 0-60 in 2.9 seconds, 341 miles range, dual motor all-wheel drive.",
      },
    ],
  }),
});

function Model3Page() {
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [selectedTrim, setSelectedTrim] = useState<"performance" | "long-range" | "rwd">("performance");

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-[#E82127] selection:text-white">
      <SiteHeader />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION: FULL-BLEED MODEL 3                                   */}
      {/* ===================================================================== */}
      <section className="relative h-screen min-h-[680px] w-full flex flex-col justify-between items-center text-center px-6 pt-24 pb-12 overflow-hidden border-b border-white/10">
        
        {/* Full-Bleed Vehicle Photography */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/assets/vehicles/model-3.avif"
            alt="Tesla Model 3"
            className="w-full h-full object-cover object-center filter contrast-110 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* Top Header & Price */}
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
            Model 3
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/90 font-medium">
            Lease starting at $299/mo &middot; From $38,990
          </p>
          <p className="text-xs text-white/70 font-mono">
            $7,500 Federal Tax Credit Eligible
          </p>
        </div>

        {/* Bottom Specs & Action Buttons */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Minimalist Specs Row */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 text-center mb-8 font-mono">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">2.9 s</div>
              <div className="text-[11px] text-white/70 uppercase tracking-widest mt-0.5">0-60 mph*</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">341 mi</div>
              <div className="text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Range (EPA est.)</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">163 mph</div>
              <div className="text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Top Speed</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <button
              onClick={() => setConfiguratorOpen(true)}
              className="w-full sm:w-52 py-3.5 px-6 rounded-md bg-[#E82127] hover:bg-[#c9181e] text-white font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#E82127]/25"
            >
              Order Now
            </button>
            <Link
              to="/portal"
              className="w-full sm:w-52 py-3.5 px-6 rounded-md bg-white/80 hover:bg-white text-black font-mono text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-all shadow-xl text-center"
            >
              Digital Cockpit
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. ALL-NEW INTERIOR & TOUCHSCREEN                                     */}
      {/* ===================================================================== */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#E82127] mb-2 font-bold">
            All-New Interior
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Immersive Sound. Whisper Quiet.
          </h2>
          <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed">
            360-degree acoustic glass keeps the cabin exceptionally quiet. Enjoy an immersive 17-speaker audio system with dual subwoofers, customizable ambient lighting, and ventilated front seats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="p-8 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h3 className="text-xl font-bold text-white">15.4" Front Display & 8" Rear Display</h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
              High-definition touchscreen with ultra-responsive touch response. Rear passengers can stream movies, adjust climate, and control audio from their own dedicated 8-inch screen.
            </p>
            <div className="font-mono text-xs text-[#E82127] font-semibold">
              Wireless Gaming &middot; Dual Phone Chargers &middot; Bluetooth Headphone Sync
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h3 className="text-xl font-bold text-white">Dual Motor All-Wheel Drive</h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
              Two independent electric motors digitally control torque to the front and rear wheels in 10 milliseconds. Unparalleled traction in rain, snow, and ice with zero mechanical linkage.
            </p>
            <div className="font-mono text-xs text-[#E82127] font-semibold">
              Instant Torque &middot; Carbon-Sleeved Rotors &middot; Track Mode V3
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. SAFETY FIRST                                                       */}
      {/* ===================================================================== */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center border-t border-white/10">
        <div className="text-xs font-mono tracking-[0.25em] uppercase text-white/60 mb-2">
          Safety Architecture
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Engineered for Maximum Protection
        </h2>
        <p className="max-w-2xl mx-auto text-sm text-white/70 font-light mb-12">
          Model 3 is built from the ground up as an electric vehicle with an ultra-high strength steel architecture and floor-mounted battery pack providing exceptional rigidity and low rollover risk.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-left">
          <div className="p-6 rounded-xl border border-white/10 bg-white/5">
            <Shield className="h-6 w-6 text-emerald-400 mb-3" />
            <div className="text-base font-bold text-white">5-Star Safety</div>
            <div className="text-xs text-white/60 mt-1">NHTSA 5-Star overall rating in every category and subcategory.</div>
          </div>
          <div className="p-6 rounded-xl border border-white/10 bg-white/5">
            <Zap className="h-6 w-6 text-amber-400 mb-3" />
            <div className="text-base font-bold text-white">Impact Protection</div>
            <div className="text-xs text-white/60 mt-1">Rigid passenger cell reinforced by extruded aluminum side rails.</div>
          </div>
          <div className="p-6 rounded-xl border border-white/10 bg-white/5">
            <Gauge className="h-6 w-6 text-sky-400 mb-3" />
            <div className="text-base font-bold text-white">Active Emergency Braking</div>
            <div className="text-xs text-white/60 mt-1">Full 360-degree cameras with predictive pedestrian collision mitigation.</div>
          </div>
        </div>
      </section>

      {/* Configurator Modal */}
      <TeslaConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        defaultProductId="model-3"
      />

      <SiteFooter />
    </div>
  );
}
