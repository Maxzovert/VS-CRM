import { InvoiceStatus } from "@prisma/client";
import { db } from "@/lib/db";

export function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

export async function syncOverdueInvoices(userId: string) {
  const now = new Date();
  await db.invoice.updateMany({
    where: {
      status: InvoiceStatus.PENDING,
      dueDate: { lt: now },
      client: { userId },
    },
    data: { status: InvoiceStatus.OVERDUE },
  });
}

export async function getClientOutstandingAmount(clientId: string) {
  const invoices = await db.invoice.findMany({
    where: {
      clientId,
      status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
    },
    include: { payments: true },
  });

  return invoices.reduce((total, invoice) => {
    const paid = invoice.payments.reduce(
      (sum, p) => sum + toNumber(p.amount),
      0
    );
    return total + Math.max(0, toNumber(invoice.amount) - paid);
  }, 0);
}

export async function getRevenueStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allPayments, mtdPayments, outstandingInvoices, overdueInvoices] =
    await Promise.all([
      db.payment.aggregate({
        where: { client: { userId } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: {
          client: { userId },
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      db.invoice.findMany({
        where: {
          client: { userId },
          status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
        },
        include: { payments: true },
      }),
      db.invoice.count({
        where: {
          client: { userId },
          status: InvoiceStatus.OVERDUE,
        },
      }),
    ]);

  const outstanding = outstandingInvoices.reduce((total, invoice) => {
    const paid = invoice.payments.reduce(
      (sum, p) => sum + toNumber(p.amount),
      0
    );
    return total + Math.max(0, toNumber(invoice.amount) - paid);
  }, 0);

  return {
    totalRevenue: toNumber(allPayments._sum.amount),
    mtdRevenue: toNumber(mtdPayments._sum.amount),
    outstanding,
    overdueCount: overdueInvoices,
  };
}

export async function updateInvoicePaymentStatus(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return;

  const paid = invoice.payments.reduce(
    (sum, p) => sum + toNumber(p.amount),
    0
  );
  const amount = toNumber(invoice.amount);

  let status = invoice.status;
  if (paid >= amount) {
    status = InvoiceStatus.PAID;
  } else if (invoice.dueDate < new Date()) {
    status = InvoiceStatus.OVERDUE;
  } else {
    status = InvoiceStatus.PENDING;
  }

  await db.invoice.update({
    where: { id: invoiceId },
    data: { status },
  });
}
