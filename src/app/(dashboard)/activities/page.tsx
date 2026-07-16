import { Suspense } from "react";
import { getActivities } from "@/app/actions/activities";
import { ActivitiesPageClient } from "@/components/activities/activities-page-client";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page =
    typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1;

  const data = await getActivities({ page, pageSize: 25 });

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <ActivitiesPageClient
        activities={data.items}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
      />
    </Suspense>
  );
}
