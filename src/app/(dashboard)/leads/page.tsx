import { Suspense } from "react";
import { getClients } from "@/app/actions/clients";
import { ClientsTable } from "@/components/clients/clients-table";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const data = await getClients({
    segment: "leads",
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    page: typeof params.page === "string" ? params.page : "1",
    pageSize: "25",
  });

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ClientsTable
        variant="leads"
        data={data.items}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        totalPages={data.totalPages}
      />
    </Suspense>
  );
}
