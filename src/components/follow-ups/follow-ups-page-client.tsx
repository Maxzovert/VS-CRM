"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowUpListView } from "@/components/follow-ups/follow-up-list-view";
import { FollowUpFormDialog } from "@/components/follow-ups/follow-up-form-dialog";
import { FollowUpMatrixView } from "@/components/follow-ups/follow-up-matrix-view";
import type { FollowUpMatrixRow } from "@/app/actions/follow-ups";
import { FollowUpStatus } from "@prisma/client";

const FollowUpKanbanView = dynamic(
  () =>
    import("@/components/follow-ups/follow-up-kanban-view").then(
      (m) => m.FollowUpKanbanView
    ),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-[#faf5e8] rounded-2xl" /> }
);

type FollowUpItem = {
  id: string;
  note: string;
  nextFollowUpDate: Date;
  status: FollowUpStatus;
  client: { id: string; name: string; companyName: string | null; email: string | null; phone: string | null };
};

export function FollowUpsPageClient({
  followUps,
  clients,
  matrix,
  templates,
}: {
  followUps: FollowUpItem[];
  clients: Array<{ id: string; name: string }>;
  matrix: { dates: string[]; rows: FollowUpMatrixRow[] };
  templates: Array<{ id: string; name: string }>;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description={`${matrix.rows.length} clients on schedule · ${followUps.length} total entries`}
        action={
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-11 px-5 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-up
          </Button>
        }
      />

      <Tabs defaultValue="schedule">
        <TabsList className="h-10 bg-[#faf5e8] p-1 rounded-full">
          <TabsTrigger value="schedule" className="text-sm rounded-full px-4 data-[state=active]:bg-[#f5f0e0]">
            Schedule
          </TabsTrigger>
          <TabsTrigger value="list" className="text-sm rounded-full px-4 data-[state=active]:bg-[#f5f0e0]">
            List
          </TabsTrigger>
          <TabsTrigger value="kanban" className="text-sm rounded-full px-4 data-[state=active]:bg-[#f5f0e0]">
            Kanban
          </TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <FollowUpMatrixView dates={matrix.dates} rows={matrix.rows} templates={templates} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <FollowUpListView followUps={followUps} templates={templates} />
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <FollowUpKanbanView followUps={followUps} />
        </TabsContent>
      </Tabs>

      <FollowUpFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
      />
    </div>
  );
}
