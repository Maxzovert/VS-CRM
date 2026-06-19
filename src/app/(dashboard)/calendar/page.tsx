import { getFollowUps } from "@/app/actions/follow-ups";
import { getClientOptions } from "@/app/actions/clients";
import { CalendarPageClient } from "@/components/calendar/calendar-page-client";

export default async function CalendarPage() {
  const [followUps, clients] = await Promise.all([
    getFollowUps(),
    getClientOptions(),
  ]);

  return <CalendarPageClient followUps={followUps} clients={clients} />;
}
