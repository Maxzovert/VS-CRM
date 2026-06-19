"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { ClientStatus } from "@prisma/client";
import { getClientById } from "@/app/actions/clients";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientFormDialog } from "./client-form-dialog";

type ClientDetail = NonNullable<Awaited<ReturnType<typeof getClientById>>>;

export function ClientSlideOver({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    startTransition(async () => {
      const data = await getClientById(clientId);
      setClient(data);
      setLoading(false);
    });
  }, [clientId, open]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {loading || !client ? (
            <div className="space-y-3 pt-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <SheetTitle className="text-base">{client.name}</SheetTitle>
                    {client.companyName && (
                      <p className="text-sm text-muted-foreground">{client.companyName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={client.status} />
                    <Button variant="ghost" size="icon-xs" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {client.email && <span>{client.email}</span>}
                  {client.phone && <span>{client.phone}</span>}
                  {client.website && (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 hover:text-foreground"
                    >
                      Website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-sm font-mono tabular-nums">
                  Outstanding: {formatCurrency(client.outstandingAmount)}
                </p>
              </SheetHeader>

              <Tabs defaultValue="overview">
                <TabsList className="h-8 w-full">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
                  <TabsTrigger value="followups" className="text-xs">Follow-ups</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-3 space-y-3">
                  {client.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{client.notes}</p>
                    </div>
                  )}
                  <Link href={`/clients/${client.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View full profile
                    </Button>
                  </Link>
                </TabsContent>

                <TabsContent value="projects" className="mt-3 space-y-2">
                  {client.projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects</p>
                  ) : (
                    client.projects.map((p) => (
                      <div key={p.id} className="rounded-md border border-border p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{p.projectName}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(Number(p.paidAmount))} / {formatCurrency(Number(p.totalAmount))}
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="invoices" className="mt-3 space-y-2">
                  {client.invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No invoices</p>
                  ) : (
                    client.invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-md border border-border p-2.5">
                        <div>
                          <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono tabular-nums">{formatCurrency(Number(inv.amount))}</p>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="followups" className="mt-3 space-y-2">
                  {client.followUps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No follow-ups</p>
                  ) : (
                    client.followUps.map((f) => (
                      <div key={f.id} className="rounded-md border border-border p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{formatDate(f.nextFollowUpDate)}</p>
                          <StatusBadge status={f.status} />
                        </div>
                        <p className="text-sm mt-1">{f.note}</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="activity" className="mt-3">
                  <ActivityFeed
                    activities={client.activities.map((a) => ({
                      ...a,
                      clientName: client.name,
                      clientId: client.id,
                    }))}
                    compact
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {client && (
        <ClientFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          variant={
            client.status === ClientStatus.LEAD || client.status === ClientStatus.LOST
              ? "leads"
              : "clients"
          }
          defaultValues={{
            id: client.id,
            name: client.name,
            companyName: client.companyName ?? "",
            email: client.email ?? "",
            phone: client.phone ?? "",
            country: client.country ?? "",
            state: client.state ?? "",
            city: client.city ?? "",
            website: client.website ?? "",
            remark: client.remark ?? "",
            status: client.status,
          }}
        />
      )}
    </>
  );
}
