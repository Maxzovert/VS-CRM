import { Suspense } from "react";
import { getDataEntries } from "@/app/actions/data-entries";
import { DataPageClient } from "@/components/data/data-page-client";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DataPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page =
    typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1;
  const search = typeof params.search === "string" ? params.search : undefined;

  const data = await getDataEntries({ page, pageSize: 50, search });

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <DataPageClient
        entries={data.items}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
      />
    </Suspense>
  );
}
