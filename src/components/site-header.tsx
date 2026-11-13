import { Link } from "@tanstack/react-router";
import { Menu, X, SlidersHorizontal, User } from "lucide-react";
import { useState } from "react";
import { SiteSearchButton } from "@/components/site-search-button";
import { LanguageSelector } from "@/components/language-selector";
import { TeslaConfiguratorModal } from "@/components/tesla-configurator-modal";
import { X3Logo3D } from "@/components/x3-logo-3d";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [configuratorProduct, setConfiguratorProduct] = useState<string>("roadster");

  const openConfigurator = (productId?: string) => {
    if (productId) setConfiguratorProduct(productId);
    setConfiguratorOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-2xl transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* X3 Emblem */}
        <Link to="/" className="flex items-center group py-1" aria-label="X3 Home">
          <X3Logo3D size="sm" />
        </Link>

        {/* Center: Tesla-Style Vehicle and Technology Navigation */}
        <nav className="hidden items-center gap-1 xl:flex">
          <Link
            to="/roadster"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Roadster
          </Link>
          <Link
            to="/cybertruck"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Cybertruck
          </Link>
          <Link
            to="/model-3"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Model 3
          </Link>
          <Link
            to="/model-y"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Model Y
          </Link>
          <Link
            to="/robotics"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Robotics
          </Link>
          <Link
            to="/technologies"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Technology
          </Link>
          <Link
            to="/inflow"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Inflow
          </Link>
          <Link
            to="/invoice"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Invoice
          </Link>
          <Link
            to="/investors"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Invest
          </Link>
          <Link
            to="/about"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            About
          </Link>
        </nav>

        {/* Right Action Icons & Tesla Account / Order Button */}
        <div className="hidden items-center gap-3 xl:flex">
          <SiteSearchButton />
          <LanguageSelector />
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors px-2.5 py-1.5 rounded-full hover:bg-white/10"
          >
            <User className="h-3.5 w-3.5" />
            Sign In
          </Link>
          <Link
            to="/portal"
            className="text-xs font-mono font-semibold text-white/70 hover:text-white transition-colors px-2 py-1.5"
          >
            Digital Cockpit
          </Link>

          {/* Tesla-Style Order Button */}
          <button
            onClick={() => openConfigurator("roadster")}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 bg-[#E82127] hover:bg-[#c9181e]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Order
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white xl:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0B0C10] px-6 py-8 xl:hidden animate-in fade-in duration-200 space-y-6">
          <button
            onClick={() => {
              setMobileOpen(false);
              openConfigurator("roadster");
            }}
            className="w-full py-3.5 rounded-xl bg-[#E82127] text-white font-mono text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Order Now
          </button>

          {/* Vehicles Subsection */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3 font-semibold">
              Vehicles & Fleet
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
              <Link
                to="/roadster"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-lg bg-white/5 text-white hover:bg-white/10"
              >
                Roadster
              </Link>
              <Link
                to="/cybertruck"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-lg bg-white/5 text-white hover:bg-white/10"
              >
                Cybertruck
              </Link>
              <Link
                to="/model-3"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-lg bg-white/5 text-white hover:bg-white/10"
              >
                Model 3
              </Link>
              <Link
                to="/model-y"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-lg bg-white/5 text-white hover:bg-white/10"
              >
                Model Y
              </Link>
              <Link
                to="/robotics"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-lg bg-white/5 text-white hover:bg-white/10 col-span-2"
              >
                Autonomous Robotics
              </Link>
            </div>
          </div>

          {/* Requested Links */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3 font-semibold">
              Platform & Accounts
            </div>
            <div className="space-y-1 text-sm font-medium">
              <Link
                to="/technologies"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              >
                Technology
              </Link>
              <Link
                to="/inflow"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              >
                Inflow
              </Link>
              <Link
                to="/invoice"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              >
                Invoice
              </Link>
              <Link
                to="/investors"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              >
                Invest
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              >
                About
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-[#E82127] font-bold hover:bg-white/10"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-white font-bold hover:bg-white/10"
              >
                Create Account
              </Link>
              <Link
                to="/portal"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sky-400 font-bold hover:bg-white/10"
              >
                Digital Cockpit
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Configurator Modal */}
      <TeslaConfiguratorModal
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        defaultProductId={configuratorProduct}
      />
    </header>
  );
}
