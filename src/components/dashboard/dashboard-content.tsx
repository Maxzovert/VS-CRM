import Link from "next/link";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getClayCardClass } from "@/lib/clay";
import { cn } from "@/lib/utils";

type DashboardProps = {
  revenue: {
    totalRevenue: number;
    mtdRevenue: number;
    outstanding: number;
    overdueCount: number;
  };
  todaysFollowUps: Array<{
    id: string;
    note: string;
    status: string;
    client: { id: string; name: string };
  }>;
  upcomingInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: { toString(): string };
    dueDate: Date;
    client: { id: string; name: string };
  }>;
  activities: Array<{
    id: string;
    type: import("@prisma/client").ActivityType;
    description: string;
    createdAt: Date;
    client: { id: string; name: string };
  }>;
  attentionClients: Array<{
    id: string;
    name: string;
    status: string;
    reason: string;
  }>;
};

const metricConfig = [
  { key: "totalRevenue" as const, label: "Total Revenue" },
  { key: "mtdRevenue" as const, label: "MTD Revenue" },
  { key: "outstanding" as const, label: "Outstanding" },
  { key: "overdueCount" as const, label: "Overdue Invoices", isCount: true },
];

export function DashboardContent({
  revenue,
  todaysFollowUps,
  upcomingInvoices,
  activities,
  attentionClients,
}: DashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-caption-uppercase text-[#6a6a6a] mb-2">Overview</p>
        <h1 className="text-display-sm text-[#0a0a0a]">Your freelance business</h1>
        <p className="text-body-sm text-[#6a6a6a] mt-2 max-w-xl">
          Revenue, follow-ups, and clients — everything you need at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricConfig.map((m, i) => {
          const value = revenue[m.key];
          const display = m.isCount
            ? String(value)
            : formatCurrency(value as number);
          const alert = m.key === "overdueCount" && (value as number) > 0;
          return (
            <div
              key={m.key}
              className={cn(
                "rounded-2xl p-5 min-h-[120px] flex flex-col justify-between",
                getClayCardClass(i)
              )}
            >
              <p className="text-caption opacity-90">{m.label}</p>
              <p
                className={cn(
                  "text-2xl font-medium tracking-tight tabular-nums mt-2",
                  alert && "text-[#ff6b5a]"
                )}
              >
                {display}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Today's Follow-ups" href="/follow-ups" index={0}>
          {todaysFollowUps.length === 0 ? (
            <EmptyState message="No follow-ups scheduled for today" />
          ) : (
            <div className="space-y-2">
              {todaysFollowUps.map((f) => (
                <Link
                  key={f.id}
                  href={`/clients/${f.client.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-[#faf5e8] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-[#0a0a0a]">
                      {f.client.name}
                    </p>
                    <p className="text-body-sm text-[#6a6a6a] truncate">{f.note}</p>
                  </div>
                  <StatusBadge status={f.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Upcoming Payments" href="/invoices" index={1}>
          {upcomingInvoices.length === 0 ? (
            <EmptyState message="No payments due in the next 14 days" />
          ) : (
            <div className="space-y-2">
              {upcomingInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/clients/${inv.client.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-[#faf5e8] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{inv.client.name}</p>
                    <p className="text-body-sm text-[#6a6a6a]">
                      {inv.invoiceNumber} · Due {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {formatCurrency(Number(inv.amount))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Clients Requiring Attention" href="/clients" index={2}>
          {attentionClients.length === 0 ? (
            <EmptyState message="All clients are in good standing" />
          ) : (
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {attentionClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-[#faf5e8] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-body-sm text-[#6a6a6a] truncate">{c.reason}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Activity" href="/activities" index={3}>
          <div className="max-h-[280px] overflow-y-auto pr-1">
            <ActivityFeed activities={activities} compact />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
  index,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <span
            className={cn("h-2.5 w-2.5 rounded-full", {
              "bg-[#ff4d8b]": index === 0,
              "bg-[#1a3a3a]": index === 1,
              "bg-[#b8a4ed]": index === 2,
              "bg-[#ffb084]": index === 3,
            })}
          />
          <h2 className="text-sm font-semibold text-[#0a0a0a]">{title}</h2>
        </div>
        <Link
          href={href}
          className="text-caption text-[#6a6a6a] hover:text-[#0a0a0a] transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="p-5 min-h-0">{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-body-sm text-[#6a6a6a] py-2">{message}</p>;
}
