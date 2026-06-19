"use server";

import { ClientStatus, FollowUpStatus, InvoiceStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/get-session";
import { getRevenueStats, syncOverdueInvoices } from "@/lib/finance";

export async function getRecentActivities(limit = 20) {
  const session = await requireSession();
  return db.activity.findMany({
    where: { userId: session.userId },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getClientsRequiringAttention() {
  const session = await requireSession();
  await syncOverdueInvoices(session.userId);

  const now = new Date();
  const leadCutoff = subDays(now, 14);

  const clients = await db.client.findMany({
    where: { userId: session.userId },
    include: {
      invoices: {
        where: { status: { in: [InvoiceStatus.OVERDUE, InvoiceStatus.PENDING] } },
      },
      followUps: {
        where: {
          status: { not: FollowUpStatus.CLOSED },
          nextFollowUpDate: { lt: now },
        },
        take: 1,
      },
    },
  });

  return clients
    .filter((client) => {
      const hasOverdue = client.invoices.some(
        (i) => i.status === InvoiceStatus.OVERDUE
      );
      const hasOverdueFollowUp = client.followUps.length > 0;
      const staleLead =
        client.status === ClientStatus.LEAD && client.createdAt < leadCutoff;
      return hasOverdue || hasOverdueFollowUp || staleLead;
    })
    .map((client) => ({
      id: client.id,
      name: client.name,
      status: client.status,
      reason: client.invoices.some((i) => i.status === InvoiceStatus.OVERDUE)
        ? "Overdue invoice"
        : client.followUps.length > 0
          ? "Overdue follow-up"
          : "Stale lead",
    }))
    .slice(0, 8);
}

export async function getDashboardData() {
  const session = await requireSession();
  await syncOverdueInvoices(session.userId);

  const [revenue, activities, attentionClients] = await Promise.all([
    getRevenueStats(session.userId),
    getRecentActivities(15),
    getClientsRequiringAttention(),
  ]);

  return { revenue, activities, attentionClients };
}
