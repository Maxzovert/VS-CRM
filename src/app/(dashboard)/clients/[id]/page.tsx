import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientStatus } from "@prisma/client";
import { getClientById } from "@/app/actions/clients";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const backHref =
    client.status === ClientStatus.LEAD || client.status === ClientStatus.LOST
      ? "/leads"
      : "/clients";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href={backHref}>
          <Button variant="ghost" size="icon-xs">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{client.name}</h1>
            <StatusBadge status={client.status} />
          </div>
          {client.companyName && (
            <p className="text-sm text-muted-foreground">{client.companyName}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
          </div>
          <p className="text-sm font-mono tabular-nums mt-2">
            Outstanding: {formatCurrency(client.outstandingAmount)}
          </p>
        </div>
      </div>

      {client.notes && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{client.notes}</p>
        </div>
      )}

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({client.projects.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({client.invoices.length})</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups ({client.followUps.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4 space-y-2">
          {client.projects.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-3 flex justify-between">
              <div>
                <p className="text-sm font-medium">{p.projectName}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={p.status} />
                <p className="text-sm font-mono tabular-nums mt-1">
                  {formatCurrency(Number(p.paidAmount))} / {formatCurrency(Number(p.totalAmount))}
                </p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-2">
          {client.invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-border p-3 flex justify-between">
              <div>
                <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono tabular-nums">{formatCurrency(Number(inv.amount))}</p>
                <StatusBadge status={inv.status} />
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="followups" className="mt-4 space-y-2">
          {client.followUps.map((f) => (
            <div key={f.id} className="rounded-lg border border-border p-3">
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">{formatDate(f.nextFollowUpDate)}</p>
                <StatusBadge status={f.status} />
              </div>
              <p className="text-sm mt-1">{f.note}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-lg border border-border p-3">
            <ActivityFeed
              activities={client.activities.map((a) => ({
                ...a,
                clientName: client.name,
                clientId: client.id,
              }))}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
