"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/get-session";
import { logActivity } from "@/lib/activity";
import { updateInvoicePaymentStatus } from "@/lib/finance";
import { paymentSchema } from "@/lib/validations/payment";
import type { ActionResult } from "@/lib/utils";

export async function createPayment(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await db.client.findFirst({
    where: { id: parsed.data.clientId, userId: session.userId },
  });
  if (!client) return { success: false, error: "Client not found" };

  if (parsed.data.invoiceId) {
    const invoice = await db.invoice.findFirst({
      where: {
        id: parsed.data.invoiceId,
        clientId: parsed.data.clientId,
        client: { userId: session.userId },
      },
    });
    if (!invoice) return { success: false, error: "Invoice not found" };
  }

  const payment = await db.payment.create({
    data: {
      clientId: parsed.data.clientId,
      invoiceId: parsed.data.invoiceId || null,
      amount: parsed.data.amount,
      paymentDate: parsed.data.paymentDate,
      method: parsed.data.method,
      notes: parsed.data.notes,
    },
  });

  if (parsed.data.invoiceId) {
    await updateInvoicePaymentStatus(parsed.data.invoiceId);
  }

  await logActivity({
    userId: session.userId,
    clientId: parsed.data.clientId,
    type: "PAYMENT_RECEIVED",
    description: `Payment of ${parsed.data.amount} received via ${parsed.data.method}`,
    metadata: { paymentId: payment.id },
  });

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true, data: { id: payment.id } };
}

export async function deletePayment(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const payment = await db.payment.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!payment) return { success: false, error: "Payment not found" };

  const invoiceId = payment.invoiceId;
  await db.payment.delete({ where: { id } });

  if (invoiceId) {
    await updateInvoicePaymentStatus(invoiceId);
  }

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function getPayments() {
  const session = await requireSession();
  return db.payment.findMany({
    where: { client: { userId: session.userId } },
    include: {
      client: { select: { id: true, name: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
    orderBy: { paymentDate: "desc" },
  });
}
