"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { FollowUpStatus } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { FollowUpFormDialog } from "@/components/follow-ups/follow-up-form-dialog";

const FollowUpCalendarView = dynamic(
  () =>
    import("@/components/follow-ups/follow-up-calendar-view").then(
      (m) => m.FollowUpCalendarView
    ),
  { ssr: false, loading: () => <div className="h-96 animate-pulse bg-[#faf5e8] rounded-2xl" /> }
);

type FollowUpItem = {
  id: string;
  note: string;
  nextFollowUpDate: Date;
  status: FollowUpStatus;
  client: { id: string; name: string };
};

export function CalendarPageClient({
  followUps,
  clients,
}: {
  followUps: FollowUpItem[];
  clients: Array<{ id: string; name: string; companyName?: string | null }>;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  const upcomingCount = followUps.filter(
    (f) => f.status !== FollowUpStatus.CLOSED
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description={`${upcomingCount} upcoming follow-ups · ${followUps.length} total entries`}
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

      <FollowUpCalendarView followUps={followUps} />

      <FollowUpFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
      />
    </div>
  );
}
