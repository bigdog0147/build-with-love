import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, ArrowDownRight, DollarSign, Activity, Zap, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/inflow")({
  component: InflowPage,
  head: () => ({
    meta: [
      { title: "Capital & Treasury Inflow | X3" },
      {
        name: "description",
        content: "Real-time liquidity, reservation volume, and capital inflow telemetry across global X3 gigafactories.",
      },
    ],
  }),
});

function InflowPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-[#E82127] selection:text-white">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#E82127] mb-2 font-bold">
            Real-Time Telemetry
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4">
            Treasury & Capital Inflow
          </h1>
          <p className="text-sm sm:text-base text-white/70 font-light">
            Real-time on-chain and institutional capital allocation streaming into active manufacturing lines and mega-arrays.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 font-mono">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center justify-between text-white/60 text-xs">
              <span>Total 30D Inflow</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">$142.8M</div>
            <div className="text-xs text-emerald-400 font-semibold">+24.6% vs last cycle</div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center justify-between text-white/60 text-xs">
              <span>Active Reservations</span>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white">48,290</div>
            <div className="text-xs text-white/60">Roadster & Cybertruck</div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center justify-between text-white/60 text-xs">
              <span>Energy Pack Billing</span>
              <Zap className="h-4 w-4 text-sky-400" />
            </div>
            <div className="text-3xl font-bold text-white">$64.2M</div>
            <div className="text-xs text-sky-400 font-semibold">3.9 MWh Industrial Megapack</div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center justify-between text-white/60 text-xs">
              <span>Settlement Status</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">100% OK</div>
            <div className="text-xs text-white/60">Zero chargeback risk</div>
          </div>
        </div>

        {/* Recent Inflow Transactions Table */}
        <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5">
          <h2 className="text-xl font-bold font-mono text-white mb-6">
            Live Settlement Ledger
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Product / Allocation</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {[
                  { id: "X3-TX-9841", prod: "Roadster Founders Series (Deposit)", method: "Wire Transfer", amt: "$50,000", time: "Just now", status: "Settled" },
                  { id: "X3-TX-9840", prod: "Cybertruck Cyberbeast Tranche", method: "Apple Pay", amt: "$250", time: "2 min ago", status: "Settled" },
                  { id: "X3-TX-9839", prod: "Megapack G3 Microgrid Tranche", method: "Institutional ACH", amt: "$420,000", time: "8 min ago", status: "Settled" },
                  { id: "X3-TX-9838", prod: "Model 3 Performance Reservation", method: "Card ending 8812", amt: "$250", time: "14 min ago", status: "Settled" },
                  { id: "X3-TX-9837", prod: "Giga Three Asia Series Equity", method: "Direct Escrow", amt: "$250,000", time: "22 min ago", status: "Settled" },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 text-white font-bold">{row.id}</td>
                    <td className="py-3.5">{row.prod}</td>
                    <td className="py-3.5 text-white/60">{row.method}</td>
                    <td className="py-3.5 text-emerald-400 font-bold">{row.amt}</td>
                    <td className="py-3.5 text-white/50">{row.time}</td>
                    <td className="py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
