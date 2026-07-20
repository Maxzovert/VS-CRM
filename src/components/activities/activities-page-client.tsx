"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ActivityType } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Button } from "@/components/ui/button";

type ActivityItem = {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: Date;
  client: { id: string; name: string } | null;
};

export function ActivitiesPageClient({
  activities,
  total,
  page,
  totalPages,
}: {
  activities: ActivityItem[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `/activities?${query}` : "/activities");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description={`${total} event${total === 1 ? "" : "s"} across your CRM`}
      />

      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-5 sm:p-6">
        {activities.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#6a6a6a]">
            No activity yet. Actions on leads, clients, invoices, and follow-ups
            will show up here.
          </p>
        ) : (
          <ActivityFeed
            activities={activities.map((a) => ({
              ...a,
              client: a.client ?? undefined,
            }))}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#6a6a6a]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-[#e5e5e5] bg-[#fffaf0] px-3"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-[#e5e5e5] bg-[#fffaf0] px-3"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
