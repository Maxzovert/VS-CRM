import { notFound } from "next/navigation";
import { getClientById } from "@/app/actions/clients";
import { ClientDetailPageClient } from "@/components/clients/client-detail-page-client";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return <ClientDetailPageClient client={client} />;
}
