import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { StatCard } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";

export const Route = createFileRoute("/_authenticated/admin/operations")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "notifications" }),
  component: OperationsPage,
  head: () => ({
    meta: [
      { title: "Operations | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Broadcast notifications, resolve support tickets, manage document templates and schedule regulatory reports for GF3X.",
      },
      { property: "og:title", content: "Operations | Gigafactory 3X Administration" },
      { property: "og:description", content: "Notifications, support, documents and reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "notifications", label: "Notifications" },
  { key: "tickets", label: "Support tickets" },
  { key: "documents", label: "Documents" },
  { key: "reports", label: "Reports" },
];

function OperationsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AdminShell
      eyebrow="Operations"
      title="Operations centre"
      sub="Customer communications, support workload, document control and scheduled reporting."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open tickets" value={18} tone="gold" />
        <StatCard label="Avg. first response" value={42} tone="electric" sub="minutes" />
        <StatCard label="Broadcasts sent (30d)" value={9} tone="silver" />
        <StatCard label="Reports scheduled" value={6} tone="success" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/operations", search: { tab: key } })} />

      {tab === "notifications" && (
        <RegistryModule
          storeKey="ops-notifications"
          title="Notification broadcasts"
          sub="Announcements delivered to customer dashboards and email."
          createLabel="New broadcast"
          filterKeys={["audience", "status"]}
          fields={[
            { key: "title", label: "Title", type: "text" },
            { key: "audience", label: "Audience", type: "select", options: ["All customers", "Verified only", "Obsidian tier", "Institutional"] },
            { key: "channel", label: "Channel", type: "select", options: ["In-app", "Email", "In-app + Email"] },
            { key: "status", label: "Status", type: "select", options: ["Draft", "Scheduled", "Sent"], tone: (v) => (v === "Sent" ? "success" : v === "Scheduled" ? "electric" : "neutral") },
            { key: "body", label: "Message", type: "textarea", hideInTable: true },
          ]}
          seed={[
            { id: "n1", title: "Q1 investor letter published", audience: "All customers", channel: "In-app + Email", status: "Sent", body: "The Q1 investor letter is now available in your documents vault." },
            { id: "n2", title: "Scheduled maintenance window", audience: "All customers", channel: "In-app", status: "Scheduled", body: "Settlement services pause for 30 minutes on Sunday 02:00 UTC." },
          ]}
        />
      )}

      {tab === "tickets" && (
        <RegistryModule
          storeKey="ops-tickets"
          title="Support tickets"
          sub="Customer requests routed to the service desk."
          createLabel="New ticket"
          filterKeys={["priority", "status"]}
          fields={[
            { key: "subject", label: "Subject", type: "text" },
            { key: "customer", label: "Customer", type: "text" },
            { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Critical"], tone: (v) => (v === "Critical" ? "danger" : v === "High" ? "gold" : "neutral") },
            { key: "status", label: "Status", type: "select", options: ["Open", "Pending customer", "Resolved"], tone: (v) => (v === "Resolved" ? "success" : v === "Open" ? "gold" : "electric") },
            { key: "owner", label: "Owner", type: "text" },
            { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
          ]}
          seed={[
            { id: "t1", subject: "Wire not credited", customer: "Helios Industrial Trust", priority: "High", status: "Open", owner: "Service desk", notes: "Awaiting correspondent bank trace." },
            { id: "t2", subject: "Add secondary signatory", customer: "Meridian Family Office", priority: "Normal", status: "Pending customer", owner: "Onboarding", notes: "Requested notarised mandate." },
          ]}
        />
      )}

      {tab === "documents" && (
        <RegistryModule
          storeKey="ops-documents"
          title="Document control"
          sub="Templates, agreements and disclosures surfaced to customers."
          createLabel="New document"
          filterKeys={["type", "status"]}
          fields={[
            { key: "name", label: "Document", type: "text" },
            { key: "type", label: "Type", type: "select", options: ["Agreement", "Disclosure", "Report", "Policy", "Template"] },
            { key: "version", label: "Version", type: "text" },
            { key: "owner", label: "Owner", type: "text" },
            { key: "status", label: "Status", type: "select", options: ["Published", "In review", "Archived"], tone: (v) => (v === "Published" ? "success" : v === "Archived" ? "neutral" : "gold") },
          ]}
          seed={[
            { id: "d1", name: "Custody agreement", type: "Agreement", version: "4.2", owner: "Legal", status: "Published" },
            { id: "d2", name: "Risk disclosure statement", type: "Disclosure", version: "2.9", owner: "Compliance", status: "In review" },
          ]}
        />
      )}

      {tab === "reports" && (
        <RegistryModule
          storeKey="ops-reports"
          title="Scheduled reports"
          sub="Regulatory and internal reporting cadence."
          createLabel="New report"
          filterKeys={["cadence"]}
          fields={[
            { key: "name", label: "Report", type: "text" },
            { key: "cadence", label: "Cadence", type: "select", options: ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"] },
            { key: "recipients", label: "Recipients", type: "text" },
            { key: "format", label: "Format", type: "select", options: ["CSV", "PDF", "XLSX"] },
            { key: "enabled", label: "Enabled", type: "toggle" },
          ]}
          seed={[
            { id: "rp1", name: "Settlement reconciliation", cadence: "Daily", recipients: "treasury@gf3x.space", format: "CSV", enabled: true },
            { id: "rp2", name: "AML transaction monitoring", cadence: "Weekly", recipients: "compliance@gf3x.space", format: "PDF", enabled: true },
            { id: "rp3", name: "Investor performance pack", cadence: "Quarterly", recipients: "investors@gf3x.space", format: "PDF", enabled: true },
          ]}
        />
      )}
    </AdminShell>
  );
}
