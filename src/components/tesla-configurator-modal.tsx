import { useState } from "react";
import { X, Check, ShieldCheck, Zap, BatteryCharging, Cpu, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface ConfiguratorProduct {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  image: string;
  specs: { label: string; value: string }[];
  description: string;
  availableColors: { name: string; hex: string; price: number; img?: string }[];
}

export const PRODUCTS: ConfiguratorProduct[] = [
  {
    id: "roadster",
    name: "X3 Roadster Founders Series",
    category: "Electric Hypercar & Aero Flight Platform",
    basePrice: 200000,
    image: "/assets/roadster/official-gallery/1-hero-rear-beam.jpg",
    specs: [
      { label: "0-60 MPH", value: "1.9 sec" },
      { label: "Top Speed", value: "+250 mph" },
      { label: "Range", value: "620 mi" },
    ],
    description: "Tri-motor all-wheel drive, active aerodynamic downforce, and optional Space-X cold-gas thruster package.",
    availableColors: [
      { name: "Solid Black", hex: "#0D0E12", price: 0, img: "/assets/roadster/official-gallery/1-hero-rear-beam.jpg" },
      { name: "Ultra Red", hex: "#A8101C", price: 2500, img: "/assets/roadster/official-gallery/3-true-pilot-profile.jpg" },
      { name: "Pearl White", hex: "#EDEDED", price: 1500, img: "/assets/roadster/official-gallery/2-wheel-aero-close.jpg" },
    ],
  },
  {
    id: "cybertruck",
    name: "X3 Cybertruck Cyberbeast",
    category: "Ultra-Hard Stainless Steel Utility",
    basePrice: 79990,
    image: "/assets/cybertruck/cybertruck-hero.avif",
    specs: [
      { label: "Towing", value: "11,000 lbs" },
      { label: "0-60 MPH", value: "2.6 sec" },
      { label: "Range", value: "340 mi" },
    ],
    description: "Ultra-Hard 30X cold-rolled stainless-steel exoskeleton, armor glass, and adaptive all-terrain air suspension.",
    availableColors: [
      { name: "Stainless Steel Exoskeleton", hex: "#9E9EA4", price: 0, img: "/assets/cybertruck/cybertruck-hero.avif" },
      { name: "Matte Black Wrap", hex: "#1C1D21", price: 6000, img: "/assets/cybertruck/cybertruck-hero.avif" },
      { name: "Satin White Wrap", hex: "#E8E8EC", price: 6000, img: "/assets/cybertruck/cybertruck-hero.avif" },
    ],
  },
  {
    id: "model-3",
    name: "X3 Model 3 Sports Sedan",
    category: "Aerodynamic Electric Sedan",
    basePrice: 38990,
    image: "/assets/vehicles/model-3.avif",
    specs: [
      { label: "0-60 MPH", value: "2.9 sec" },
      { label: "Range", value: "341 mi" },
      { label: "Top Speed", value: "163 mph" },
    ],
    description: "Sports tuned adaptive suspension, acoustic surround glass, low drag coefficient, and precision handling.",
    availableColors: [
      { name: "Stealth Grey", hex: "#3A3D40", price: 0, img: "/assets/vehicles/model-3.avif" },
      { name: "Pearl White Multi-Coat", hex: "#EDEDED", price: 1000, img: "/assets/vehicles/model-3.avif" },
      { name: "Deep Blue Metallic", hex: "#1E3A8A", price: 1000, img: "/assets/vehicles/model-3.avif" },
      { name: "Ultra Red", hex: "#A8101C", price: 2000, img: "/assets/vehicles/model-3.avif" },
    ],
  },
  {
    id: "model-y",
    name: "X3 Model Y Performance",
    category: "All-Wheel Drive Dual Motor Utility",
    basePrice: 44990,
    image: "/assets/vehicles/model-y.avif",
    specs: [
      { label: "0-60 MPH", value: "3.5 sec" },
      { label: "Range", value: "303 mi" },
      { label: "Drive", value: "Dual Motor AWD" },
    ],
    description: "Maximum versatility, spacious 5-passenger cargo, superior NHTSA 5-star safety ratings, and instant response.",
    availableColors: [
      { name: "Stealth Grey", hex: "#3A3D40", price: 0, img: "/assets/vehicles/model-y.avif" },
      { name: "Pearl White", hex: "#EDEDED", price: 1000, img: "/assets/vehicles/model-y.avif" },
      { name: "Ultra Red", hex: "#A8101C", price: 2000, img: "/assets/vehicles/model-y.avif" },
      { name: "Solid Black", hex: "#0D0E12", price: 1500, img: "/assets/vehicles/model-y.avif" },
    ],
  },
  {
    id: "cyberbot",
    name: "X3 Autonomous Robotic Fleet",
    category: "Optimus & Industrial Automation",
    basePrice: 150000,
    image: "/assets/roadster/official-gallery/5-front-beam-cinematic.jpg",
    specs: [
      { label: "Payload Capacity", value: "2,500 kg" },
      { label: "Cycle Speed", value: "0.28 sec" },
      { label: "Autonomy Level", value: "Level 5 Full Mesh" },
    ],
    description: "Multi-axis autonomous assembly robot with integrated neural computer and real-time lidar telemetry.",
    availableColors: [
      { name: "Industrial Obsidian", hex: "#111215", price: 0 },
      { name: "Titanium White", hex: "#EDEDED", price: 2500 },
    ],
  },
];

interface TeslaConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: string;
}

export function TeslaConfiguratorModal({ isOpen, onClose, defaultProductId = "roadster" }: TeslaConfiguratorProps) {
  const [selectedProduct, setSelectedProduct] = useState<ConfiguratorProduct>(() => {
    return PRODUCTS.find((p) => p.id === defaultProductId) || PRODUCTS[0];
  });

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [fsdSelected, setFsdSelected] = useState(true);
  const [slaSelected, setSlaSelected] = useState(false);
  const [reserved, setReserved] = useState(false);

  if (!isOpen) return null;

  const color = selectedProduct.availableColors[selectedColorIndex] || selectedProduct.availableColors[0];
  const colorPrice = color?.price || 0;
  const fsdPrice = fsdSelected ? 12000 : 0;
  const slaPrice = slaSelected ? 8500 : 0;
  const totalPrice = selectedProduct.basePrice + colorPrice + fsdPrice + slaPrice;
  const depositDue = selectedProduct.id === "roadster" ? 5000 : 250;

  const handleProductChange = (prod: ConfiguratorProduct) => {
    setSelectedProduct(prod);
    setSelectedColorIndex(0);
    setReserved(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0C0D12] text-white shadow-2xl p-6 sm:p-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-all"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Product Selector Pills */}
        <div className="mb-6">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E82127] mb-2 font-bold">
            X3 Digital Vehicle & System Configurator
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
            {selectedProduct.name}
          </h2>

          <div className="flex flex-wrap gap-2 pb-2">
            {PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                onClick={() => handleProductChange(prod)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                  selectedProduct.id === prod.id
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {prod.name.replace("X3 ", "")}
              </button>
            ))}
          </div>
        </div>

        {reserved ? (
          <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="h-16 w-16 grid place-items-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-6">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Reservation Confirmed
            </h3>
            <p className="text-white/70 max-w-md text-sm mb-6">
              Your {selectedProduct.name} build has been registered in the X3 Fleet Ledger.
              Reservation ID: <span className="font-mono text-white font-bold">X3-{Math.random().toString(36).substring(2, 9).toUpperCase()}</span>.
            </p>
            <div className="p-4 rounded-xl border border-white/15 bg-white/5 w-full max-w-sm mb-6 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-white/60">
                <span>Color:</span>
                <span className="text-white">{color.name}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Full Self-Driving:</span>
                <span className="text-white">{fsdSelected ? "Included (v12)" : "None"}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Est. Total:</span>
                <span className="text-white">${totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#E82127] font-bold pt-2 border-t border-white/10">
                <span>Deposit Paid:</span>
                <span>${depositDue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Link
                to="/portal"
                className="px-6 py-3 rounded-lg bg-[#E82127] hover:bg-[#c9181e] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                Go to Digital Cockpit
              </Link>
              <button
                onClick={() => setReserved(false)}
                className="px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider transition-all"
              >
                Modify Build
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Real Vehicle Image & Specs */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-xl group">
                <img
                  src={color.img || selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover object-center filter contrast-110 brightness-100 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono">
                  <span className="px-3 py-1 rounded bg-black/75 border border-white/15 text-white">
                    {color.name}
                  </span>
                  <span className="text-white/70">
                    Est. Delivery: 2-4 Weeks
                  </span>
                </div>
              </div>

              {/* Specs Bar */}
              <div className="grid grid-cols-3 gap-3">
                {selectedProduct.specs.map((sp) => (
                  <div key={sp.label} className="p-3.5 rounded-xl border border-white/10 bg-white/5 text-center font-mono">
                    <div className="text-lg sm:text-xl font-bold text-white">{sp.value}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">{sp.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
                {selectedProduct.description}
              </p>
            </div>

            {/* Right Column: Options & Financial Ledger */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              
              {/* Exterior Finish */}
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-white/60 mb-3">
                  Paint & Exterior Finish
                </div>
                <div className="flex items-center gap-3">
                  {selectedProduct.availableColors.map((c, idx) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColorIndex(idx)}
                      className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                        selectedColorIndex === idx ? "border-white scale-110 shadow-lg" : "border-white/20 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.name} (+$${c.price})`}
                    >
                      {selectedColorIndex === idx && (
                        <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-white/70 font-mono">
                  {color.name} {color.price > 0 ? `(+$${color.price.toLocaleString()})` : "(Included)"}
                </div>
              </div>

              {/* Autonomous Neural Autopilot */}
              <div
                onClick={() => setFsdSelected(!fsdSelected)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  fsdSelected ? "border-[#E82127] bg-[#E82127]/10" : "border-white/15 bg-white/5 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold text-white">
                  <span>Full Self-Driving (Supervised)</span>
                  <span>+$12,000</span>
                </div>
                <p className="mt-1.5 text-[11px] text-white/60 leading-relaxed">
                  Automatic lane change, autosteer on city streets, traffic light recognition, and summon.
                </p>
              </div>

              {/* Comprehensive SLA */}
              <div
                onClick={() => setSlaSelected(!slaSelected)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  slaSelected ? "border-emerald-500 bg-emerald-500/10" : "border-white/15 bg-white/5 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold text-white">
                  <span>10-Year Comprehensive Fleet SLA</span>
                  <span>+$8,500</span>
                </div>
                <p className="mt-1.5 text-[11px] text-white/60 leading-relaxed">
                  24/7 on-site robotics engineer, zero-downtime component swaps, and high-priority cellular uplink.
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-white/10 font-mono space-y-2 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Base Price:</span>
                  <span>${selectedProduct.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Options & Upgrades:</span>
                  <span>+${(colorPrice + fsdPrice + slaPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span>Total Vehicle Value:</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#E82127] pt-1">
                  <span>Fully Refundable Deposit Due Today:</span>
                  <span>${depositDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setReserved(true)}
                className="w-full py-4 rounded-xl bg-[#E82127] hover:bg-[#c9181e] text-white font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#E82127]/25 flex items-center justify-center gap-2"
              >
                Confirm Configuration & Reserve &middot; ${depositDue.toLocaleString()}
                <ArrowRight className="h-4 w-4" />
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
