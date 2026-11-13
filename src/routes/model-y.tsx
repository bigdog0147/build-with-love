import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Zap, Gauge, Layers, Check, ArrowRight } from "lucide-react";
import { TeslaConfiguratorModal } from "@/components/tesla-configurator-modal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/model-y")({
  component: ModelYPage,
  head: () => ({
    meta: [
      { title: "Model Y | X3" },
      {
        name: "description",
        content: "Model Y all-wheel drive electric SUV. 76 cubic feet of cargo, 303 miles range, 0-60 in 3.5 seconds.",
      },
    ],
  }),
});

function ModelYPage() {
  const [configuratorOpen, setConfiguratorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-[#E82127] selection:text-white">
      <SiteHeader />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION: FULL-BLEED MODEL Y                                   */}
      {/* ===================================================================== */}
      <section className="relative h-screen min-h-[680px] w-full flex flex-col justify-between items-center text-center px-6 pt-24 pb-12 overflow-hidden border-b border-white/10">
        
        {/* Full-Bleed Vehicle Photography */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/assets/vehicles/model-y.avif"
            alt="Tesla Model Y"
            className="w-full h-full object-cover object-center filter contrast-110 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* Top Header & Price */}
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
            Model Y
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/90 font-medium">
            From $31,490 after Federal Tax Credit &middot; Lease from $379/mo
          </p>
          <p className="text-xs text-white/70 font-mono">
            World's Best-Selling Vehicle
          </p>
        </div>

        {/* Bottom Specs & Action Buttons */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Minimalist Specs Row */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 text-center mb-8 font-mono">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">76 cu ft</div>
              <div className="text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Max Cargo</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">303 mi</div>
              <div className="text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Range (EPA est.)</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">3.5 s</div>
              <div className="text-[11px] text-white/70 uppercase tracking-widest mt-0.5">0-60 mph*</div>
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
      {/* 2. VERSATILITY & SEATING                                              */}
      {/* ===================================================================== */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#E82127] mb-2 font-bold">
            Maximum Versatility
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Room for People and Gear
          </h2>
          <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed">
            With versatile seating for up to seven passengers and fold-flat second row seats, Model Y accommodates skis, camping gear, luggage, and road-trip adventures with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <div className="text-3xl font-bold text-white">76 cu ft</div>
            <div className="text-xs uppercase tracking-wider text-[#E82127]">Flexible Cargo</div>
            <p className="text-xs text-white/60 font-sans leading-relaxed">
              Rear seats fold independently flat. An illuminated front trunk (frunk) stores extra luggage or charging cables out of sight.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <div className="text-3xl font-bold text-white">AWD</div>
            <div className="text-xs uppercase tracking-wider text-[#E82127]">Dual Motor Traction</div>
            <p className="text-xs text-white/60 font-sans leading-relaxed">
              Two ultra-responsive motors distribute power between front and rear axles for instant traction in snow, mud, and rain.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <div className="text-3xl font-bold text-white">Camp Mode</div>
            <div className="text-xs uppercase tracking-wider text-[#E82127]">Cabin Climate & Power</div>
            <p className="text-xs text-white/60 font-sans leading-relaxed">
              Maintains optimal airflow and temperature overnight while powering laptops, devices, and interior mood lighting.
            </p>
          </div>
        </div>
      </section>

      {/* Configurator Modal */}
      <TeslaConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        defaultProductId="model-y"
      />

      <SiteFooter />
    </div>
  );
}
