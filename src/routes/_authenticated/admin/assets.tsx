import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { StatCard } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";

export const Route = createFileRoute("/_authenticated/admin/assets")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "assets" }),
  component: AssetsPage,
  head: () => ({
    meta: [
      { title: "Assets & Projects | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "Register and manage GF3X physical assets, industrial projects, real estate, renewable energy, mining operations, carbon credits and the marketplace.",
      },
      { property: "og:title", content: "Assets & Projects | Gigafactory 3X Administration" },
      { property: "og:description", content: "Industrial asset and project registry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "assets", label: "Assets" },
  { key: "projects", label: "Projects" },
  { key: "real-estate", label: "Real estate" },
  { key: "energy", label: "Renewable energy" },
  { key: "mining", label: "Mining" },
  { key: "carbon", label: "Carbon credits" },
  { key: "marketplace", label: "Marketplace" },
];

function AssetsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AdminShell
      eyebrow="Assets"
      title="Assets & projects"
      sub="Registry of every physical and financial asset under GF3X stewardship, from gigafactory equipment to carbon inventory."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Registered assets" value={148} />
        <StatCard label="Book value" value={2140000000} format="currency" tone="gold" />
        <StatCard label="Active projects" value={26} tone="electric" />
        <StatCard label="Carbon inventory" value={412000} tone="success" sub="tCO₂e" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/assets", search: { tab: key } })} />

      {tab === "assets" && (
        <RegistryModule
          storeKey="assets-core"
          title="Asset register"
          sub="Capital equipment and industrial infrastructure."
          createLabel="New asset"
          filterKeys={["class", "status"]}
          fields={[
            { key: "name", label: "Asset", type: "text" },
            { key: "class", label: "Class", type: "select", options: ["Equipment", "Facility", "Fleet", "IP", "Infrastructure"] },
            { key: "site", label: "Site", type: "text" },
            { key: "value", label: "Book value (USD)", type: "number" },
            { key: "status", label: "Status", type: "select", options: ["Operating", "Maintenance", "Idle", "Disposed"], tone: (v) => (v === "Operating" ? "success" : v === "Disposed" ? "danger" : "gold") },
          ]}
          seed={[
            { id: "as1", name: "Cell coating line A7", class: "Equipment", site: "Nevada", value: 42000000, status: "Operating" },
            { id: "as2", name: "Robotic weld cell cluster", class: "Equipment", site: "Rotterdam", value: 18500000, status: "Maintenance" },
            { id: "as3", name: "Digital twin platform licence", class: "IP", site: "Global", value: 9400000, status: "Operating" },
          ]}
        />
      )}

      {tab === "projects" && (
        <RegistryModule
          storeKey="assets-projects"
          title="Project pipeline"
          sub="Engineering and construction programmes with delivery status."
          createLabel="New project"
          filterKeys={["stage"]}
          fields={[
            { key: "name", label: "Project", type: "text" },
            { key: "lead", label: "Programme lead", type: "text" },
            { key: "budget", label: "Budget (USD)", type: "number" },
            { key: "spent", label: "Spent (USD)", type: "number" },
            { key: "stage", label: "Stage", type: "select", options: ["Scoping", "Design", "Build", "Handover", "Complete"], tone: (v) => (v === "Complete" ? "success" : v === "Build" ? "gold" : "electric") },
            { key: "progress", label: "Progress", type: "number", suffix: "%" },
          ]}
          seed={[
            { id: "pr1", name: "Line 7 automation retrofit", lead: "A. Okafor", budget: 64000000, spent: 38000000, stage: "Build", progress: 59 },
            { id: "pr2", name: "Chennai wafer annex", lead: "R. Venkat", budget: 690000000, spent: 121000000, stage: "Design", progress: 21 },
          ]}
        />
      )}

      {tab === "real-estate" && (
        <RegistryModule
          storeKey="assets-real-estate"
          title="Real estate"
          sub="Land, industrial parks and corporate premises."
          createLabel="New holding"
          filterKeys={["type"]}
          fields={[
            { key: "name", label: "Property", type: "text" },
            { key: "location", label: "Location", type: "text" },
            { key: "type", label: "Type", type: "select", options: ["Industrial", "Land bank", "Office", "Logistics"] },
            { key: "area", label: "Area (m²)", type: "number" },
            { key: "value", label: "Valuation (USD)", type: "number" },
            { key: "leased", label: "Leased out", type: "toggle" },
          ]}
          seed={[
            { id: "re1", name: "Gigapark North", location: "Nevada, USA", type: "Industrial", area: 480000, value: 312000000, leased: false },
            { id: "re2", name: "Port logistics hub", location: "Rotterdam, NL", type: "Logistics", area: 96000, value: 88000000, leased: true },
          ]}
        />
      )}

      {tab === "energy" && (
        <RegistryModule
          storeKey="assets-energy"
          title="Renewable energy"
          sub="Generation and storage assets powering the manufacturing footprint."
          createLabel="New installation"
          filterKeys={["technology"]}
          fields={[
            { key: "name", label: "Installation", type: "text" },
            { key: "technology", label: "Technology", type: "select", options: ["Solar", "Wind", "Storage", "Hydrogen", "Geothermal"] },
            { key: "capacity_mw", label: "Capacity", type: "number", suffix: "MW" },
            { key: "output_gwh", label: "Annual output", type: "number", suffix: "GWh" },
            { key: "online", label: "Online", type: "toggle" },
          ]}
          seed={[
            { id: "en1", name: "Nevada solar array", technology: "Solar", capacity_mw: 340, output_gwh: 612, online: true },
            { id: "en2", name: "North Sea wind offtake", technology: "Wind", capacity_mw: 180, output_gwh: 690, online: true },
            { id: "en3", name: "Jubail hydrogen plant", technology: "Hydrogen", capacity_mw: 220, output_gwh: 410, online: false },
          ]}
        />
      )}

      {tab === "mining" && (
        <RegistryModule
          storeKey="assets-mining"
          title="Mining & raw materials"
          sub="Upstream supply positions securing critical minerals."
          createLabel="New operation"
          filterKeys={["mineral", "status"]}
          fields={[
            { key: "name", label: "Operation", type: "text" },
            { key: "mineral", label: "Mineral", type: "select", options: ["Lithium", "Nickel", "Cobalt", "Copper", "Graphite", "Rare earths"] },
            { key: "country", label: "Country", type: "text" },
            { key: "offtake_pct", label: "Offtake share", type: "number", suffix: "%" },
            { key: "status", label: "Status", type: "select", options: ["Producing", "Development", "Exploration"], tone: (v) => (v === "Producing" ? "success" : "gold") },
          ]}
          seed={[
            { id: "mi1", name: "Salar lithium brine", mineral: "Lithium", country: "Chile", offtake_pct: 35, status: "Producing" },
            { id: "mi2", name: "Sulawesi nickel JV", mineral: "Nickel", country: "Indonesia", offtake_pct: 22, status: "Development" },
          ]}
        />
      )}

      {tab === "carbon" && (
        <RegistryModule
          storeKey="assets-carbon"
          title="Carbon credits"
          sub="Retirement inventory and offset programmes."
          createLabel="New credit block"
          filterKeys={["registry", "status"]}
          fields={[
            { key: "project", label: "Project", type: "text" },
            { key: "registry", label: "Registry", type: "select", options: ["Verra", "Gold Standard", "ACR", "Puro.earth"] },
            { key: "vintage", label: "Vintage", type: "number" },
            { key: "tonnes", label: "Volume", type: "number", suffix: "tCO₂e" },
            { key: "price", label: "Price (USD)", type: "number" },
            { key: "status", label: "Status", type: "select", options: ["Held", "Retired", "Listed"], tone: (v) => (v === "Retired" ? "success" : "gold") },
          ]}
          seed={[
            { id: "cc1", project: "Amazon reforestation", registry: "Verra", vintage: 2024, tonnes: 180000, price: 18.4, status: "Held" },
            { id: "cc2", project: "Direct air capture pilot", registry: "Puro.earth", vintage: 2025, tonnes: 42000, price: 132, status: "Listed" },
          ]}
        />
      )}

      {tab === "marketplace" && (
        <RegistryModule
          storeKey="assets-marketplace"
          title="Marketplace listings"
          sub="Assets and allocations offered to qualified customers."
          createLabel="New listing"
          filterKeys={["status"]}
          fields={[
            { key: "title", label: "Listing", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Equity", "Debt", "Carbon", "Equipment", "Real estate"] },
            { key: "price", label: "Ask (USD)", type: "number" },
            { key: "min_ticket", label: "Minimum ticket (USD)", type: "number" },
            { key: "status", label: "Status", type: "select", options: ["Live", "Draft", "Sold"], tone: (v) => (v === "Live" ? "success" : v === "Sold" ? "neutral" : "gold") },
            { key: "summary", label: "Summary", type: "textarea", hideInTable: true },
          ]}
          seed={[
            { id: "mk1", title: "Rotterdam robotics co-invest", category: "Equity", price: 24000000, min_ticket: 500000, status: "Live", summary: "Direct co-investment alongside the GF3X balance sheet." },
            { id: "mk2", title: "Carbon retirement block 2025", category: "Carbon", price: 5544000, min_ticket: 100000, status: "Draft", summary: "Puro.earth verified removals." },
          ]}
        />
      )}
    </AdminShell>
  );
}
