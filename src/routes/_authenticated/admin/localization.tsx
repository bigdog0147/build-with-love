import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { StatCard } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";

export const Route = createFileRoute("/_authenticated/admin/localization")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "countries" }),
  component: LocalizationPage,
  head: () => ({
    meta: [
      { title: "Localization | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Control supported countries, settlement currencies and interface languages across the GF3X platform.",
      },
      { property: "og:title", content: "Localization | Gigafactory 3X Administration" },
      { property: "og:description", content: "Country, currency and language configuration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "countries", label: "Countries" },
  { key: "currencies", label: "Currencies" },
  { key: "languages", label: "Languages" },
];

function LocalizationPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AdminShell
      eyebrow="Localization"
      title="Localization"
      sub="Jurisdictional availability, settlement currencies and interface languages."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Countries enabled" value={38} />
        <StatCard label="Restricted jurisdictions" value={11} tone="danger" />
        <StatCard label="Settlement currencies" value={14} tone="gold" />
        <StatCard label="Interface languages" value={8} tone="electric" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/localization", search: { tab: key } })} />

      {tab === "countries" && (
        <RegistryModule
          storeKey="loc-countries"
          title="Countries"
          sub="Onboarding availability and verification requirements by jurisdiction."
          createLabel="New country"
          filterKeys={["status", "risk"]}
          fields={[
            { key: "name", label: "Country", type: "text" },
            { key: "code", label: "ISO code", type: "text" },
            { key: "status", label: "Status", type: "select", options: ["Enabled", "Review only", "Restricted"], tone: (v) => (v === "Enabled" ? "success" : v === "Restricted" ? "danger" : "gold") },
            { key: "risk", label: "Risk rating", type: "select", options: ["Low", "Medium", "High"], tone: (v) => (v === "Low" ? "success" : v === "High" ? "danger" : "gold") },
            { key: "kyc_level", label: "KYC level", type: "select", options: ["Standard", "Enhanced"] },
          ]}
          seed={[
            { id: "co1", name: "United States", code: "US", status: "Enabled", risk: "Low", kyc_level: "Enhanced" },
            { id: "co2", name: "United Kingdom", code: "GB", status: "Enabled", risk: "Low", kyc_level: "Standard" },
            { id: "co3", name: "United Arab Emirates", code: "AE", status: "Enabled", risk: "Medium", kyc_level: "Enhanced" },
            { id: "co4", name: "Singapore", code: "SG", status: "Enabled", risk: "Low", kyc_level: "Standard" },
            { id: "co5", name: "Nigeria", code: "NG", status: "Review only", risk: "High", kyc_level: "Enhanced" },
          ]}
        />
      )}

      {tab === "currencies" && (
        <RegistryModule
          storeKey="loc-currencies"
          title="Currencies"
          sub="Settlement and display currencies available to customers."
          createLabel="New currency"
          filterKeys={["type"]}
          fields={[
            { key: "code", label: "Code", type: "text" },
            { key: "name", label: "Name", type: "text" },
            { key: "type", label: "Type", type: "select", options: ["Fiat", "Digital asset", "Commodity"] },
            { key: "decimals", label: "Decimals", type: "number" },
            { key: "settlement", label: "Settlement enabled", type: "toggle" },
          ]}
          seed={[
            { id: "cu1", code: "USD", name: "US Dollar", type: "Fiat", decimals: 2, settlement: true },
            { id: "cu2", code: "EUR", name: "Euro", type: "Fiat", decimals: 2, settlement: true },
            { id: "cu3", code: "GBP", name: "Pound Sterling", type: "Fiat", decimals: 2, settlement: true },
            { id: "cu4", code: "BTC", name: "Bitcoin", type: "Digital asset", decimals: 8, settlement: true },
            { id: "cu5", code: "XAU", name: "Gold (troy ounce)", type: "Commodity", decimals: 3, settlement: false },
          ]}
        />
      )}

      {tab === "languages" && (
        <RegistryModule
          storeKey="loc-languages"
          title="Languages"
          sub="Interface locales and translation coverage."
          createLabel="New language"
          filterKeys={["status"]}
          fields={[
            { key: "name", label: "Language", type: "text" },
            { key: "locale", label: "Locale", type: "text" },
            { key: "coverage", label: "Coverage", type: "number", suffix: "%" },
            { key: "status", label: "Status", type: "select", options: ["Live", "Beta", "Draft"], tone: (v) => (v === "Live" ? "success" : v === "Beta" ? "electric" : "neutral") },
            { key: "default_locale", label: "Default", type: "toggle" },
          ]}
          seed={[
            { id: "lg1", name: "English", locale: "en-US", coverage: 100, status: "Live", default_locale: true },
            { id: "lg2", name: "German", locale: "de-DE", coverage: 94, status: "Live", default_locale: false },
            { id: "lg3", name: "Arabic", locale: "ar-AE", coverage: 82, status: "Beta", default_locale: false },
            { id: "lg4", name: "Japanese", locale: "ja-JP", coverage: 61, status: "Draft", default_locale: false },
          ]}
        />
      )}
    </AdminShell>
  );
}
