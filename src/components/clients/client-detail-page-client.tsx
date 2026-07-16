"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
} from "lucide-react";
import { ClientStatus } from "@prisma/client";
import type { getClientById } from "@/app/actions/clients";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCurrency,
  formatDate,
  formatLocation,
  getInitials,
} from "@/lib/utils";
import { ClientFormDialog } from "./client-form-dialog";

type ClientDetail = NonNullable<Awaited<ReturnType<typeof getClientById>>>;

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e5e5e5] bg-[#faf5e8]/60 px-4 py-10 text-center">
      <p className="text-sm text-[#6a6a6a]">{message}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl px-4 py-3.5 ${accent ?? "bg-[#f5f0e0]"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a6a6a]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-[#0a0a0a]">
        {value}
      </p>
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
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faf5e8] text-[#6a6a6a]">
        <Icon className="h-4 w-4" />
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

export function ClientDetailPageClient({ client }: { client: ClientDetail }) {
  const [editOpen, setEditOpen] = useState(false);
  const isLead =
    client.status === ClientStatus.LEAD || client.status === ClientStatus.LOST;
  const backHref = isLead ? "/leads" : "/clients";
  const location = formatLocation(client.country, client.state, client.city);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Link href={backHref}>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-xl border-[#e5e5e5] bg-[#fffaf0] hover:bg-[#faf5e8]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b8a4ed] text-base font-semibold text-[#0a0a0a]">
            {getInitials(client.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title-lg text-[#0a0a0a]">{client.name}</h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="mt-0.5 text-sm text-[#6a6a6a]">
              {client.companyName || (isLead ? "Lead profile" : "Client profile")}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-[#e5e5e5] gap-1.5 hover:bg-[#faf5e8]"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit details
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Outstanding"
            value={formatCurrency(client.outstandingAmount)}
            accent="bg-[#f5f0e0]"
          />
          <StatCard
            label="Projects"
            value={String(client.projects.length)}
            accent="bg-[#b8a4ed]/35"
          />
          <StatCard
            label="Invoices"
            value={String(client.invoices.length)}
            accent="bg-[#ffb084]/40"
          />
          <StatCard
            label="Follow-ups"
            value={String(client.followUps.length)}
            accent="bg-[#a4d4c5]/45"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Contact + notes */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] px-4 divide-y divide-[#e5e5e5]">
            <DetailRow icon={Mail} label="Email">
              {client.email || <span className="text-[#9a9a9a]">Not set</span>}
            </DetailRow>
            <DetailRow icon={Phone} label="Phone">
              {client.phone || <span className="text-[#9a9a9a]">Not set</span>}
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

          {!client.notes && !(isLead && client.remark) && (
            <EmptyState message="No notes yet. Use Edit details to add context." />
          )}
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-4 sm:p-5">
          <Tabs defaultValue="projects" className="gap-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-[#faf5e8] p-1.5">
              <TabsTrigger
                value="projects"
                className="rounded-xl px-3 py-1.5 text-xs gap-1.5 data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Projects ({client.projects.length})
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="rounded-xl px-3 py-1.5 text-xs gap-1.5 data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
              >
                <FileText className="h-3.5 w-3.5" />
                Invoices ({client.invoices.length})
              </TabsTrigger>
              <TabsTrigger
                value="followups"
                className="rounded-xl px-3 py-1.5 text-xs gap-1.5 data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Follow-ups ({client.followUps.length})
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-xl px-3 py-1.5 text-xs data-[state=active]:bg-[#fffaf0] data-[state=active]:shadow-none"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-0 space-y-2">
              {client.projects.length === 0 ? (
                <EmptyState message="No projects for this client yet." />
              ) : (
                client.projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[#e5e5e5] bg-[#faf5e8]/50 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0a0a0a]">{p.projectName}</p>
                      {p.description && (
                        <p className="mt-1 text-xs text-[#6a6a6a] line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={p.status} />
                      <p className="mt-1.5 text-xs tabular-nums text-[#6a6a6a]">
                        {formatCurrency(Number(p.paidAmount))} /{" "}
                        {formatCurrency(Number(p.totalAmount))}
                      </p>
                    </div>
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
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5e5e5] bg-[#faf5e8]/50 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0a0a0a]">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-[#6a6a6a]">
                        Due {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-[#0a0a0a]">
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
                    className="rounded-2xl border border-[#e5e5e5] bg-[#faf5e8]/50 p-3.5"
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
                <div className="rounded-2xl border border-[#e5e5e5] bg-[#faf5e8]/50 p-3.5">
                  <ActivityFeed
                    activities={client.activities.map((a) => ({
                      ...a,
                      clientName: client.name,
                      clientId: client.id,
                    }))}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
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
    </div>
  );
}
