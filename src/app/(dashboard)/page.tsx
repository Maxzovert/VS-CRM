import { getDashboardData } from "@/app/actions/activities";
import { getTodaysFollowUps } from "@/app/actions/follow-ups";
import { getUpcomingInvoices } from "@/app/actions/invoices";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const [dashboard, todaysFollowUps, upcomingInvoices] = await Promise.all([
    getDashboardData(),
    getTodaysFollowUps(),
    getUpcomingInvoices(14),
  ]);

  return (
    <DashboardContent
      revenue={dashboard.revenue}
      todaysFollowUps={todaysFollowUps}
      upcomingInvoices={upcomingInvoices}
      activities={dashboard.activities}
      attentionClients={dashboard.attentionClients}
    />
  );
}
