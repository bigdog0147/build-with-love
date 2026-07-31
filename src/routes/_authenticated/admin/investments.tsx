import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { AreaChart, Bars, Donut, Panel, PanelHead, StatCard } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";

export const Route = createFileRoute("/_authenticated/admin/investments")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "portfolio" }),
  component: InvestmentsPage,
  head: () => ({
    meta: [
      { title: "Investments | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "Manage GF3X investment products, customer investment accounts, gigafactory programmes and performance attribution.",
      },
      { property: "og:title", content: "Investments | Gigafactory 3X Administration" },
      { property: "og:description", content: "Investment product and performance administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "portfolio", label: "Portfolio" },
  { key: "categories", label: "Categories" },
  { key: "accounts", label: "Investment accounts" },
  { key: "gigafactory", label: "Gigafactory investments" },
  { key: "performance", label: "Performance" },
];

function InvestmentsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AdminShell
      eyebrow="Investments"
      title="Investment administration"
      sub="Product shelf, subscription accounts, gigafactory capital programmes and performance attribution."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Programmes" value={12} />
        <StatCard label="Committed capital" value={862000000} format="currency" tone="gold" />
        <StatCard label="Deployed" value={614000000} format="currency" tone="electric" />
        <StatCard label="Net IRR" value={18.4} format="percent" tone="success" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/investments", search: { tab: key } })} />

      {tab === "portfolio" && (
        <RegistryModule
          storeKey="inv-products"
          title="Investment products"
          sub="The product shelf offered to verified customers."
          createLabel="New product"
          filterKeys={["category", "status"]}
          fields={[
            { key: "name", label: "Product", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Robotics", "Battery", "Semiconductors", "Automation", "Energy", "Infrastructure"] },
            { key: "target_yield", label: "Target yield", type: "number", suffix: "%" },
            { key: "min_ticket", label: "Minimum ticket (USD)", type: "number" },
            { key: "aum", label: "AUM (USD)", type: "number" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Open", "Closed", "Fully subscribed"],
              tone: (v) => (v === "Open" ? "success" : v === "Closed" ? "neutral" : "gold"),
            },
          ]}
          seed={[
            { id: "p1", name: "Gigaline Battery Fund II", category: "Battery", target_yield: 14.5, min_ticket: 250000, aum: 184000000, status: "Open" },
            { id: "p2", name: "Autonomous Robotics Growth", category: "Robotics", target_yield: 19.2, min_ticket: 500000, aum: 226000000, status: "Open" },
            { id: "p3", name: "Advanced Node Semiconductors", category: "Semiconductors", target_yield: 16.8, min_ticket: 1000000, aum: 312000000, status: "Fully subscribed" },
            { id: "p4", name: "Grid-Scale Energy Storage", category: "Energy", target_yield: 11.4, min_ticket: 150000, aum: 140000000, status: "Open" },
          ]}
        />
      )}

      {tab === "categories" && (
        <RegistryModule
          storeKey="inv-categories"
          title="Investment categories"
          sub="Taxonomy powering customer-facing filters and reporting."
          createLabel="New category"
          fields={[
            { key: "name", label: "Category", type: "text" },
            { key: "weight", label: "Target weight", type: "number", suffix: "%" },
            { key: "risk", label: "Risk band", type: "select", options: ["Conservative", "Balanced", "Growth", "Venture"] },
            { key: "visible", label: "Visible to customers", type: "toggle" },
          ]}
          seed={[
            { id: "c1", name: "Robotics", weight: 24, risk: "Growth", visible: true },
            { id: "c2", name: "Battery systems", weight: 21, risk: "Balanced", visible: true },
            { id: "c3", name: "Semiconductors", weight: 26, risk: "Venture", visible: true },
            { id: "c4", name: "Industrial automation", weight: 17, risk: "Balanced", visible: true },
            { id: "c5", name: "Digital twin", weight: 12, risk: "Venture", visible: false },
          ]}
        />
      )}

      {tab === "accounts" && (
        <RegistryModule
          storeKey="inv-accounts"
          title="Investment accounts"
          sub="Customer subscriptions, commitments and drawdown state."
          createLabel="New subscription"
          filterKeys={["status"]}
          fields={[
            { key: "customer", label: "Customer", type: "text" },
            { key: "product", label: "Product", type: "text" },
            { key: "committed", label: "Committed (USD)", type: "number" },
            { key: "drawn", label: "Drawn (USD)", type: "number" },
            { key: "return_pct", label: "Return", type: "number", suffix: "%" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Active", "Pending", "Closed"],
              tone: (v) => (v === "Active" ? "success" : v === "Closed" ? "neutral" : "gold"),
            },
          ]}
          seed={[
            { id: "a1", customer: "Helios Industrial Trust", product: "Gigaline Battery Fund II", committed: 12000000, drawn: 8400000, return_pct: 15.2, status: "Active" },
            { id: "a2", customer: "Meridian Family Office", product: "Autonomous Robotics Growth", committed: 6500000, drawn: 6500000, return_pct: 21.7, status: "Active" },
            { id: "a3", customer: "Northwind Pension", product: "Advanced Node Semiconductors", committed: 24000000, drawn: 11000000, return_pct: 9.4, status: "Pending" },
          ]}
        />
      )}

      {tab === "gigafactory" && (
        <RegistryModule
          storeKey="inv-gigafactory"
          title="Gigafactory investments"
          sub="Direct capital programmes across the manufacturing footprint."
          createLabel="New programme"
          filterKeys={["phase", "site"]}
          fields={[
            { key: "programme", label: "Programme", type: "text" },
            { key: "site", label: "Site", type: "select", options: ["Nevada", "Rotterdam", "Jubail", "Chennai", "Johor", "Querétaro"] },
            { key: "capex", label: "Capex (USD)", type: "number" },
            { key: "capacity", label: "Capacity", type: "text" },
            {
              key: "phase",
              label: "Phase",
              type: "select",
              options: ["Design", "Construction", "Commissioning", "Operating"],
              tone: (v) => (v === "Operating" ? "success" : v === "Construction" ? "gold" : "electric"),
            },
            { key: "completion", label: "Completion", type: "number", suffix: "%" },
          ]}
          seed={[
            { id: "g1", programme: "Cell Line 7 expansion", site: "Nevada", capex: 480000000, capacity: "42 GWh / yr", phase: "Construction", completion: 63 },
            { id: "g2", programme: "Robotic assembly cluster", site: "Rotterdam", capex: 214000000, capacity: "1.2M units / yr", phase: "Commissioning", completion: 88 },
            { id: "g3", programme: "Wafer fabrication annex", site: "Chennai", capex: 690000000, capacity: "18k wafers / mo", phase: "Design", completion: 21 },
            { id: "g4", programme: "Green hydrogen plant", site: "Jubail", capex: 355000000, capacity: "90 kt / yr", phase: "Operating", completion: 100 },
          ]}
        />
      )}

      {tab === "performance" && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Panel glow>
            <PanelHead title="Blended programme performance" sub="Indexed, trailing 12 months" />
            <div className="p-4 sm:p-5">
              <AreaChart
                data={[100, 103, 106, 104, 109, 114, 118, 121, 119, 126, 131, 138]}
                labels={["12m", "8m", "4m", "Now"]}
                color="var(--gold)"
                height={210}
              />
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Attribution by sleeve" />
            <div className="p-4 sm:p-5">
              <Donut
                slices={[
                  { label: "Semiconductors", value: 32, color: "var(--gold)" },
                  { label: "Robotics", value: 26, color: "var(--electric)" },
                  { label: "Battery", value: 21, color: "var(--silver)" },
                  { label: "Automation", value: 13, color: "var(--success)" },
                  { label: "Energy", value: 8, color: "oklch(0.7 0.16 300)" },
                ]}
              />
            </div>
          </Panel>
          <Panel className="lg:col-span-2">
            <PanelHead title="Return by site" sub="Realised return contribution" />
            <div className="p-4 sm:p-5">
              <Bars
                data={[
                  { label: "Nevada", value: 24.1 },
                  { label: "Rotterdam", value: 18.6 },
                  { label: "Jubail", value: 15.2 },
                  { label: "Chennai", value: 12.8 },
                  { label: "Johor", value: 9.4 },
                  { label: "Querétaro", value: 7.1 },
                ]}
              />
            </div>
          </Panel>
        </div>
      )}
    </AdminShell>
  );
}
