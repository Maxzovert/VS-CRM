import { getFollowUps, getFollowUpMatrix } from "@/app/actions/follow-ups";
import { getClientOptions } from "@/app/actions/clients";
import { getEmailTemplates } from "@/app/actions/emails";
import { FollowUpsPageClient } from "@/components/follow-ups/follow-ups-page-client";

export default async function FollowUpsPage() {
  const [followUps, clients, matrix, templates] = await Promise.all([
    getFollowUps(),
    getClientOptions(),
    getFollowUpMatrix(),
    getEmailTemplates(),
  ]);

  return (
    <FollowUpsPageClient
      followUps={followUps}
      clients={clients}
      matrix={matrix}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
