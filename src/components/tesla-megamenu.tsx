import { Link } from "@tanstack/react-router";
import { ArrowRight, Bot, BatteryCharging, Cpu, Factory, Zap, ShieldCheck } from "lucide-react";

export interface MegamenuItem {
  title: string;
  specs: string;
  badge?: string;
  description: string;
  to: string;
}

export const MEGAMENU_DATA: Record<string, MegamenuItem[]> = {
  "Robotics": [
    {
      title: "G3 CyberBot Fleet",
      specs: "2.5t Payload · Level 5 Autonomy",
      badge: "Flagship",
      description: "High-precision 6-axis autonomous assembly robot with integrated neural computer.",
      to: "/technologies",
    },
    {
      title: "Autonomous Heavy Hauler",
      specs: "80,000 lbs Towing · Zero Emission",
      badge: "Enterprise",
      description: "Self-navigating automated industrial transport for inter-facility logistics.",
      to: "/technologies",
    },
    {
      title: "Aerial Telemetry Drone",
      specs: "100 km Range · LiDAR Inspection",
      description: "Continuous facility perimeter and thermal scanning for predictive maintenance.",
      to: "/technologies",
    },
  ],
  "Energy": [
    {
      title: "Megapack G3 System",
      specs: "3.9 MWh · 93.5% Efficiency",
      badge: "Utility Scale",
      description: "Stationary energy storage designed to stabilize industrial grids and renewable inputs.",
      to: "/infrastructure",
    },
    {
      title: "Industrial Solar Canopy",
      specs: "240 W/m² · Integrated Inverters",
      description: "High-efficiency bifacial photovoltaic structures turning roofs into power plants.",
      to: "/infrastructure",
    },
    {
      title: "Supercharger Microgrid",
      specs: "1.2 MW Continuous · Liquid Cooled",
      description: "Ultra-fast direct DC distribution for autonomous heavy-duty fleets.",
      to: "/infrastructure",
    },
  ],
  "Silicon & AI": [
    {
      title: "G3 Neural Silicon Rack",
      specs: "2.4 PFLOPS · 3nm Process",
      badge: "Custom Die",
      description: "Dedicated neural inference clusters for closed-loop real-time factory physics simulation.",
      to: "/innovation",
    },
    {
      title: "Industrial Digital Twin",
      specs: "< 1ms Telemetry Latency",
      description: "Sub-millimeter synchronisation between physical robots and real-time simulations.",
      to: "/innovation",
    },
  ],
  "Invest": [
    {
      title: "Giga Three Asia Round",
      specs: "15.4% Target IRR · $250k Min",
      badge: "Open Now",
      description: "Series C institutional co-investment tranche for our 500 GWh factory expansion.",
      to: "/investors",
    },
    {
      title: "Marketplace Opportunities",
      specs: "Direct Private Placements",
      description: "Curated energy infrastructure, debt and equity tranches with real-time portfolio tracking.",
      to: "/marketplace",
    },
  ],
};

interface TeslaMegamenuProps {
  activeCategory: string | null;
  onClose: () => void;
  onOpenConfigurator: (productId?: string) => void;
}

export function TeslaMegamenu({ activeCategory, onClose, onOpenConfigurator }: TeslaMegamenuProps) {
  if (!activeCategory || !MEGAMENU_DATA[activeCategory]) return null;

  const items = MEGAMENU_DATA[activeCategory];

  return (
    <div
      onMouseLeave={onClose}
      className="absolute left-0 right-0 top-full border-b border-white/10 bg-[var(--surface-elevated)]/95 backdrop-blur-2xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-2 z-50 px-6 py-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            <h3 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              {activeCategory} Ecosystem
            </h3>
          </div>
          <button
            onClick={() => onOpenConfigurator()}
            className="text-xs font-semibold text-[var(--primary)] hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Launch Tesla-Grade Configurator <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-[var(--primary)]/60 hover:bg-white/[0.05] transition-all duration-200"
            >
              {item.badge && (
                <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30">
                  {item.badge}
                </span>
              )}
              <h4 className="font-display text-lg font-bold group-hover:text-white transition-colors">
                {item.title}
              </h4>
              <div className="mt-1 text-xs font-medium text-[var(--primary)]">{item.specs}</div>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
                >
                  Learn More
                </Link>
                <button
                  onClick={() => {
                    onClose();
                    onOpenConfigurator(item.title.toLowerCase().includes("megapack") ? "megapack" : item.title.toLowerCase().includes("silicon") ? "neural-silicon" : "cyberbot");
                  }}
                  className="rounded-full px-3 py-1 text-xs font-medium text-white shadow transition-transform hover:scale-105"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
