import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, CheckCircle2, Search, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/invoice")({
  component: InvoicePage,
  head: () => ({
    meta: [
      { title: "Vehicle & Fleet Invoices | X3" },
      {
        name: "description",
        content: "Lookup and download official X3 vehicle reservation invoices, purchase agreements, and tax receipts.",
      },
    ],
  }),
});

function InvoicePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const INVOICES = [
    {
      id: "INV-2026-X3-0091",
      vin: "5YJSA1E26PF908122",
      product: "X3 Roadster Founders Series (Deposit)",
      amount: "$5,000.00",
      date: "Nov 12, 2026",
      status: "Paid",
      entity: "X3 High-Performance Automotive LLC",
    },
    {
      id: "INV-2026-X3-0084",
      vin: "7G2CE1E56RF449018",
      product: "Cybertruck Cyberbeast Tri-Motor",
      amount: "$250.00",
      date: "Nov 10, 2026",
      status: "Paid",
      entity: "X3 High-Performance Automotive LLC",
    },
    {
      id: "INV-2026-X3-0072",
      vin: "5YJ3E1EB8NF119304",
      product: "Model 3 Sports Sedan Long Range AWD",
      amount: "$250.00",
      date: "Nov 06, 2026",
      status: "Paid",
      entity: "X3 High-Performance Automotive LLC",
    },
  ];

  const handleDownload = (id: string) => {
    setDownloadSuccess(`Generated official signed PDF for ${id}`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-[#E82127] selection:text-white">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#E82127] mb-2 font-bold">
            Official Records
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4">
            Invoices & Receipts
          </h1>
          <p className="text-sm sm:text-base text-white/70 font-light">
            Download certified PDF invoices, state purchase receipts, and manufacturer allocation documents.
          </p>
        </div>

        {downloadSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{downloadSuccess} &mdash; Download started.</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by VIN or Invoice # (e.g. INV-2026)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/15 bg-white/5 text-sm text-white placeholder-white/40 focus:border-[#E82127] outline-none font-mono"
          />
        </div>

        {/* Invoice Cards */}
        <div className="space-y-4">
          {INVOICES.map((inv) => (
            <div
              key={inv.id}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{inv.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    {inv.status}
                  </span>
                </div>
                <div className="text-white/80 font-sans text-sm">{inv.product}</div>
                <div className="text-white/50 text-[11px]">
                  VIN: <span className="text-white/80">{inv.vin}</span> &middot; Date: {inv.date}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{inv.amount}</div>
                  <div className="text-[10px] text-white/50">{inv.entity}</div>
                </div>

                <button
                  onClick={() => handleDownload(inv.id)}
                  className="px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white text-black hover:text-black font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
