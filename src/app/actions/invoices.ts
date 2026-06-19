"use server";

import { revalidatePath } from "next/cache";
import { InvoiceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/get-session";
import { logActivity } from "@/lib/activity";
import { syncOverdueInvoices } from "@/lib/finance";
import { invoiceSchema } from "@/lib/validations/invoice";
import type { ActionResult } from "@/lib/utils";

export async function createInvoice(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const payload =
    typeof data === "object" && data !== null
      ? {
          ...(data as Record<string, unknown>),
          amount: Number((data as { amount?: unknown }).amount),
          dueDate:
            (data as { dueDate?: unknown }).dueDate instanceof Date
              ? (data as { dueDate: Date }).dueDate
              : new Date(String((data as { dueDate?: unknown }).dueDate)),
        }
      : data;
  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await db.client.findFirst({
    where: { id: parsed.data.clientId, userId: session.userId },
  });
  if (!client) return { success: false, error: "Client not found" };

  let status = parsed.data.status;
  if (status === InvoiceStatus.PENDING && parsed.data.dueDate < new Date()) {
    status = InvoiceStatus.OVERDUE;
  }

  const invoice = await db.invoice.create({
    data: {
      clientId: parsed.data.clientId,
      invoiceNumber: parsed.data.invoiceNumber,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      status,
    },
  });

  await logActivity({
    userId: session.userId,
    clientId: parsed.data.clientId,
    type: "INVOICE_CREATED",
    description: `Invoice ${invoice.invoiceNumber} created for ${parsed.data.amount}`,
  });

  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true, data: { id: invoice.id } };
}

export async function updateInvoice(id: string, data: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = invoiceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invoice = await db.invoice.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!invoice) return { success: false, error: "Invoice not found" };

  let status = parsed.data.status;
  if (status !== InvoiceStatus.PAID && parsed.data.dueDate < new Date()) {
    status = InvoiceStatus.OVERDUE;
  }

  await db.invoice.update({
    where: { id },
    data: {
      invoiceNumber: parsed.data.invoiceNumber,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      status,
    },
  });

  await logActivity({
    userId: session.userId,
    clientId: invoice.clientId,
    type: "INVOICE_UPDATED",
    description: `Invoice ${parsed.data.invoiceNumber} updated`,
  });

  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const invoice = await db.invoice.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!invoice) return { success: false, error: "Invoice not found" };

  await db.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function getInvoices() {
  const session = await requireSession();
  await syncOverdueInvoices(session.userId);

  return db.invoice.findMany({
    where: { client: { userId: session.userId } },
    include: {
      client: { select: { id: true, name: true, email: true } },
      payments: true,
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function getUpcomingInvoices(days = 14) {
  const session = await requireSession();
  await syncOverdueInvoices(session.userId);

  const end = new Date();
  end.setDate(end.getDate() + days);

  return db.invoice.findMany({
    where: {
      client: { userId: session.userId },
      status: InvoiceStatus.PENDING,
      dueDate: { lte: end, gte: new Date() },
    },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
    take: 10,
  });
}
