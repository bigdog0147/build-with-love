import {
  ArrowRight,
  Atom,
  BatteryCharging,
  Bot,
  Cpu,
  Factory,
  Gauge,
  Globe2,
  Layers,
  LineChart,
  Network,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Reveal, CountUp } from "@/components/reveal";
import { GlassCard } from "@/components/section";

export const HIGHLIGHTS = [
  {
    icon: Atom,
    name: "Artificial Intelligence",
    desc: "Sovereign foundation models and industrial copilots orchestrating every plant, cell and process in real time.",
  },
  {
    icon: Bot,
    name: "Robotics & Automation",
    desc: "Autonomous manipulators, mobile fleets and closed-loop control engineered for lights-out precision at scale.",
  },
  {
    icon: Factory,
    name: "Advanced Manufacturing",
    desc: "Vertically integrated giga-scale production — from wafer to finished system — under one digital twin.",
  },
  {
    icon: SunMedium,
    name: "Clean Energy Systems",
    desc: "On-site solar, storage and grid intelligence powering carbon-neutral operations across every gigasite.",
  },
];

export const CORE_TECHS = [
  { icon: Atom, name: "Artificial Intelligence" },
  { icon: Bot, name: "Robotics" },
  { icon: Factory, name: "Advanced Manufacturing" },
  { icon: BatteryCharging, name: "Battery Systems" },
  { icon: Cpu, name: "Semiconductors" },
  { icon: Network, name: "Industrial Automation" },
  { icon: Radar, name: "Digital Twin Systems" },
  { icon: Rocket, name: "Aerospace Systems" },
];

export function LegacyEcosystemSections() {
  return null; // Preserved for reference without cluttering main flagship template
}
