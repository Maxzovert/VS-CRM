"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";
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
import { formatCurrency, formatDate, formatLocation, getInitials } from "@/lib/utils";
import { ClientFormDialog } from "./client-form-dialog";

type ClientDetail = NonNullable<Awaited<ReturnType<typeof getClientById>>>;

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e5e5e5] bg-[#faf5e8]/60 px-4 py-8 text-center">
      <p className="text-sm text-[#6a6a6a]">{message}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#faf5e8] text-[#6a6a6a]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a9a9a]">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-[#0a0a0a] wrap-break-word">{children}</div>
      </div>
    </div>
  );
}

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

  const reloadClient = useCallback(() => {
    startTransition(async () => {
      const data = await getClientById(clientId);
      setClient(data);
      setLoading(false);
    });
  }, [clientId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    reloadClient();
  }, [clientId, open, reloadClient]);

  const isLead =
    client?.status === ClientStatus.LEAD || client?.status === ClientStatus.LOST;
  const location = client
    ? formatLocation(client.country, client.state, client.city)
    : "—";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          showCloseButton
          className="w-full gap-0 border-l border-[#e5e5e5] bg-[#fffaf0] p-0 sm:max-w-md"
        >
          {loading || !client ? (
            <div className="space-y-4 p-6 pt-14">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <SheetHeader className="shrink-0 space-y-4 border-b border-[#e5e5e5] p-6 pr-14 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#b8a4ed] text-sm font-semibold text-[#0a0a0a]">
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SheetTitle className="text-lg font-semibold tracking-tight text-[#0a0a0a]">
                        {client.name}
                      </SheetTitle>
                      <StatusBadge status={client.status} />
                    </div>
                    {client.companyName ? (
                      <p className="mt-0.5 text-sm text-[#6a6a6a]">{client.companyName}</p>
                    ) : (
                      <p className="mt-0.5 text-sm text-[#9a9a9a]">No company</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f5f0e0] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
                    Outstanding
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-[#0a0a0a]">
                    {formatCurrency(client.outstandingAmount)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 rounded-xl border-[#e5e5e5] bg-[#fffaf0] hover:bg-[#faf5e8]"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit details
                  </Button>
                  <Link href={`/clients/${client.id}`} className="flex-1">
                    <Button
                      size="sm"
                      className="h-10 w-full rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f]"
                    >
                      Full profile
                    </Button>
                  </Link>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-4">
                <Tabs defaultValue="overview" className="gap-4">
                  <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-[#faf5e8] p-1.5">
                    <TabsTrigger
                      value="overview"
                      className="rounded-xl px-3 py-1.5 text-xs data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="projects"
                      className="rounded-xl px-3 py-1.5 text-xs data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
                    >
                      Projects
                    </TabsTrigger>
                    <TabsTrigger
                      value="invoices"
                      className="rounded-xl px-3 py-1.5 text-xs data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
                    >
                      Invoices
                    </TabsTrigger>
                    <TabsTrigger
                      value="followups"
                      className="rounded-xl px-3 py-1.5 text-xs data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
                    >
                      Follow-ups
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="rounded-xl px-3 py-1.5 text-xs data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
                    >
                      Activity
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] px-3 divide-y divide-[#e5e5e5]">
                      <DetailRow icon={Mail} label="Email">
                        {client.email || (
                          <span className="text-[#9a9a9a]">Not set</span>
                        )}
                      </DetailRow>
                      <DetailRow icon={Phone} label="Phone">
                        {client.phone || (
                          <span className="text-[#9a9a9a]">Not set</span>
                        )}
                      </DetailRow>
                      <DetailRow icon={Globe} label="Website">
                        {client.website ? (
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            {client.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[#9a9a9a]">Not set</span>
                        )}
                      </DetailRow>
                      <DetailRow icon={MapPin} label="Location">
                        {location !== "—" ? (
                          location
                        ) : (
                          <span className="text-[#9a9a9a]">Not set</span>
                        )}
                      </DetailRow>
                    </div>

                    {(client.notes || (isLead && client.remark)) && (
                      <div className="space-y-3">
                        {client.notes && (
                          <div className="rounded-2xl border border-[#e5e5e5] bg-[#faf5e8] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
                              Notes
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-[#0a0a0a] whitespace-pre-wrap">
                              {client.notes}
                            </p>
                          </div>
                        )}
                        {isLead && client.remark && (
                          <div className="rounded-2xl border border-[#e5e5e5] bg-[#faf5e8] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
                              Remark
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-[#0a0a0a] whitespace-pre-wrap">
                              {client.remark}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!client.notes && !(isLead && client.remark) && (
                      <EmptyState message="No notes yet. Use Edit details to add context." />
                    )}
                  </TabsContent>

                  <TabsContent value="projects" className="mt-0 space-y-2">
                    {client.projects.length === 0 ? (
                      <EmptyState message="No projects for this client yet." />
                    ) : (
                      client.projects.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-[#0a0a0a]">
                              {p.projectName}
                            </p>
                            <StatusBadge status={p.status} />
                          </div>
                          {p.description && (
                            <p className="mt-1 text-xs text-[#6a6a6a] line-clamp-2">
                              {p.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs tabular-nums text-[#6a6a6a]">
                            {formatCurrency(Number(p.paidAmount))} /{" "}
                            {formatCurrency(Number(p.totalAmount))}
                          </p>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="invoices" className="mt-0 space-y-2">
                    {client.invoices.length === 0 ? (
                      <EmptyState message="No invoices yet." />
                    ) : (
                      client.invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-3.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#0a0a0a]">
                              {inv.invoiceNumber}
                            </p>
                            <p className="text-xs text-[#6a6a6a]">
                              Due {formatDate(inv.dueDate)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium tabular-nums text-[#0a0a0a]">
                              {formatCurrency(Number(inv.amount))}
                            </p>
                            <div className="mt-1 flex justify-end">
                              <StatusBadge status={inv.status} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="followups" className="mt-0 space-y-2">
                    {client.followUps.length === 0 ? (
                      <EmptyState message="No follow-ups scheduled." />
                    ) : (
                      client.followUps.map((f) => (
                        <div
                          key={f.id}
                          className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-[#6a6a6a]">
                              {formatDate(f.nextFollowUpDate)}
                            </p>
                            <StatusBadge status={f.status} />
                          </div>
                          <p className="mt-1.5 text-sm text-[#0a0a0a]">
                            {f.note || "No note"}
                          </p>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="activity" className="mt-0">
                    {client.activities.length === 0 ? (
                      <EmptyState message="No activity recorded yet." />
                    ) : (
                      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-3.5">
                        <ActivityFeed
                          activities={client.activities.map((a) => ({
                            ...a,
                            clientName: client.name,
                            clientId: client.id,
                          }))}
                          compact
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {client && (
        <ClientFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={reloadClient}
          variant={isLead ? "leads" : "clients"}
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
            notes: client.notes ?? "",
            remark: client.remark ?? "",
            status: client.status,
          }}
        />
      )}
    </>
  );
}
