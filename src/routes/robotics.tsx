import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Cpu, Eye, Gauge, Shield, Zap, ArrowRight, Play } from "lucide-react";
import { TeslaConfiguratorModal } from "@/components/tesla-configurator-modal";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/robotics")({
  component: RoboticsPage,
  head: () => ({
    meta: [
      { title: "Autonomous Robotics | X3" },
      {
        name: "description",
        content: "Next-generation bipedal humanoid robots and factory automation systems powered by custom neural network coprocessors.",
      },
    ],
  }),
});

function RoboticsPage() {
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoId: "", title: "" });

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-[#E82127] selection:text-white">
      <SiteHeader />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION: AUTONOMOUS ROBOTICS                                  */}
      {/* ===================================================================== */}
      <section className="relative h-screen min-h-[680px] w-full flex flex-col justify-between items-center text-center px-6 pt-24 pb-12 overflow-hidden border-b border-white/10">
        
        {/* Full-Bleed Robotics Visual */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/assets/roadster/official-gallery/5-front-beam-cinematic.jpg"
            alt="X3 Autonomous Robotics"
            className="w-full h-full object-cover object-center filter contrast-125 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
            Optimus & Fleet
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/90 font-medium">
            General Purpose Bipedal Humanoid & Lights-Out Factory Robotics
          </p>
          <p className="text-xs text-white/70 font-mono">
            Autonomous Neural AI &middot; Sub-Millimeter Repeatability
          </p>
        </div>

        {/* Bottom Specs & Action Buttons */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Minimalist Specs Row */}
          <div className="grid grid-cols-4 gap-4 sm:gap-10 text-center mb-8 font-mono">
            <div>
              <div className="text-xl sm:text-3xl font-bold text-white">28 DoF</div>
              <div className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Degrees of Freedom</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold text-white">5 mph</div>
              <div className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Walk Speed</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold text-white">20 kg</div>
              <div className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Payload Carry</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold text-white">2.3 kWh</div>
              <div className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-widest mt-0.5">Onboard Battery</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <button
              onClick={() => setConfiguratorOpen(true)}
              className="w-full sm:w-52 py-3.5 px-6 rounded-md bg-[#E82127] hover:bg-[#c9181e] text-white font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#E82127]/25"
            >
              Order Fleet
            </button>
            <button
              onClick={() => setVideoModal({ isOpen: true, videoId: "cpraXaw7dyc", title: "X3 Autonomous Robotics" })}
              className="w-full sm:w-52 py-3.5 px-6 rounded-md bg-white/80 hover:bg-white text-black font-mono text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-all shadow-xl text-center flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              Watch Film
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. CORE ROBOTIC SYSTEMS                                               */}
      {/* ===================================================================== */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#E82127] mb-2 font-bold">
            Autonomous Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Physical AI Operating in Human Environments
          </h2>
          <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed">
            Built using the same neural network architecture that drives our vehicles. Optimus perceives the world through multi-camera vision, predicts motion, and navigates obstacles autonomously.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <Eye className="h-8 w-8 text-[#E82127]" />
            <div className="text-xl font-bold text-white">Full AI Vision</div>
            <p className="text-xs text-white/60 font-sans leading-relaxed">
              Occupancy network running on custom silicon processes eight video streams simultaneously to reconstruct 3D space in real time.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <Zap className="h-8 w-8 text-amber-400" />
            <div className="text-xl font-bold text-white">Dexterous Hands</div>
            <p className="text-xs text-white/60 font-sans leading-relaxed">
              11-degree-of-freedom hands with tactile sensing fingers capable of holding fragile objects or operating industrial torque wrenches.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <Shield className="h-8 w-8 text-emerald-400" />
            <div className="text-xl font-bold text-white">Fleet Swarm Intelligence</div>
            <p className="text-xs text-white/60 font-sans leading-relaxed">
              Every robot shares learned trajectories and task policies across the central gigasite mesh network for instant workforce retraining.
            </p>
          </div>
        </div>
      </section>

      {/* Configurator Modal */}
      <TeslaConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        defaultProductId="cyberbot"
      />

      {/* Video Modal */}
      <VideoPlayerModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoId={videoModal.videoId}
        title={videoModal.title}
      />

      <SiteFooter />
    </div>
  );
}
