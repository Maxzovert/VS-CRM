"use server";

import { revalidatePath } from "next/cache";
import { EmailType, FollowUpStatus, ReminderType } from "@prisma/client";
import { requireSession } from "@/lib/auth/get-session";
import {
  sendFollowUpReminderEmail,
  sendPaymentReminderEmail,
  sendEmail,
} from "@/lib/email/resend";
import {
  emailTemplateSchema,
  renderTemplate,
  type TemplateVariables,
} from "@/lib/validations/email-template";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/utils";
import { format } from "date-fns";

export async function createEmailTemplate(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = emailTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const template = await db.emailTemplate.create({
    data: { ...parsed.data, userId: session.userId },
  });

  revalidatePath("/templates");
  return { success: true, data: { id: template.id } };
}

export async function updateEmailTemplate(id: string, data: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = emailTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.emailTemplate.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return { success: false, error: "Template not found" };

  await db.emailTemplate.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/templates");
  return { success: true };
}

export async function deleteEmailTemplate(id: string): Promise<ActionResult> {
  const session = await requireSession();
  await db.emailTemplate.deleteMany({
    where: { id, userId: session.userId },
  });
  revalidatePath("/templates");
  return { success: true };
}

export async function getEmailTemplates() {
  const session = await requireSession();
  return db.emailTemplate.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });
}

export async function getEmailLogs() {
  const session = await requireSession();
  return db.emailLog.findMany({
    where: { userId: session.userId },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { sentAt: "desc" },
    take: 50,
  });
}

async function buildEmailContext(
  userId: string,
  clientId: string,
  followUpId?: string,
  invoiceId?: string
): Promise<
  | {
      to: string;
      clientName: string;
      variables: TemplateVariables;
      emailType: EmailType;
      followUpId?: string;
      invoiceId?: string;
    }
  | { error: string }
> {
  const client = await db.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) return { error: "Client not found" };
  if (!client.email) return { error: "Client has no email address" };

  const variables: TemplateVariables = {
    clientName: client.name,
    companyName: client.companyName ?? "",
    email: client.email,
    phone: client.phone ?? "",
  };

  let emailType: EmailType = EmailType.FOLLOWUP_REMINDER;
  let resolvedFollowUpId = followUpId;
  let resolvedInvoiceId = invoiceId;

  if (invoiceId) {
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, clientId, client: { userId } },
    });
    if (!invoice) return { error: "Invoice not found" };
    variables.amount = Number(invoice.amount).toFixed(2);
    variables.dueDate = format(invoice.dueDate, "MMM d, yyyy");
    variables.invoiceNumber = invoice.invoiceNumber;
    emailType = EmailType.PAYMENT_REMINDER;
    resolvedInvoiceId = invoice.id;
  }

  if (followUpId) {
    const followUp = await db.followUp.findFirst({
      where: { id: followUpId, clientId, client: { userId } },
    });
    if (!followUp) return { error: "Follow-up not found" };
    variables.followUpNote = followUp.note;
    variables.dueDate = format(followUp.nextFollowUpDate, "MMM d, yyyy");
    emailType = EmailType.FOLLOWUP_REMINDER;
    resolvedFollowUpId = followUp.id;
  } else if (!invoiceId) {
    const openFollowUp = await db.followUp.findFirst({
      where: {
        clientId,
        client: { userId },
        status: { not: FollowUpStatus.CLOSED },
      },
      orderBy: { nextFollowUpDate: "asc" },
    });
    if (openFollowUp) {
      variables.followUpNote = openFollowUp.note;
      variables.dueDate = format(openFollowUp.nextFollowUpDate, "MMM d, yyyy");
      resolvedFollowUpId = openFollowUp.id;
    }
  }

  if (!invoiceId) {
    const latestInvoice = await db.invoice.findFirst({
      where: { clientId, client: { userId } },
      orderBy: { dueDate: "desc" },
    });
    if (latestInvoice) {
      variables.amount = Number(latestInvoice.amount).toFixed(2);
      variables.invoiceNumber = latestInvoice.invoiceNumber;
      if (!variables.dueDate) {
        variables.dueDate = format(latestInvoice.dueDate, "MMM d, yyyy");
      }
      resolvedInvoiceId = resolvedInvoiceId ?? latestInvoice.id;
    }
  }

  return {
    to: client.email,
    clientName: client.name,
    variables,
    emailType,
    followUpId: resolvedFollowUpId,
    invoiceId: resolvedInvoiceId,
  };
}

export async function getEmailPreview(input: {
  templateId: string;
  clientId: string;
  followUpId?: string;
  invoiceId?: string;
}): Promise<
  ActionResult<{
    to: string;
    subject: string;
    body: string;
    clientName: string;
    templateName: string;
  }>
> {
  const session = await requireSession();

  const template = await db.emailTemplate.findFirst({
    where: { id: input.templateId, userId: session.userId },
  });
  if (!template) return { success: false, error: "Template not found" };

  const context = await buildEmailContext(
    session.userId,
    input.clientId,
    input.followUpId,
    input.invoiceId
  );
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  return {
    success: true,
    data: {
      to: context.to,
      clientName: context.clientName,
      templateName: template.name,
      subject: renderTemplate(template.subject, context.variables),
      body: renderTemplate(template.body, context.variables),
    },
  };
}

export async function sendEmailWithTemplate(input: {
  templateId: string;
  clientId: string;
  followUpId?: string;
  invoiceId?: string;
  subject: string;
  body: string;
}): Promise<ActionResult> {
  const session = await requireSession();

  const template = await db.emailTemplate.findFirst({
    where: { id: input.templateId, userId: session.userId },
  });
  if (!template) return { success: false, error: "Template not found" };

  const context = await buildEmailContext(
    session.userId,
    input.clientId,
    input.followUpId,
    input.invoiceId
  );
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const result = await sendEmail({
    userId: session.userId,
    clientId: input.clientId,
    to: context.to,
    subject: input.subject.trim(),
    body: input.body.trim(),
    type: context.emailType,
    templateId: template.id,
    followUpId: context.followUpId,
    invoiceId: context.invoiceId,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to send email" };
  }

  if (context.followUpId && context.emailType === EmailType.FOLLOWUP_REMINDER) {
    await db.followUp.update({
      where: { id: context.followUpId },
      data: { reminderSent: true },
    });
  }

  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
  revalidatePath("/invoices");
  revalidatePath("/templates");
  revalidatePath("/clients");
  return { success: true };
}

export async function sendClientFollowUpEmail(
  clientId: string,
  followUpId?: string
): Promise<ActionResult> {
  const session = await requireSession();

  const client = await db.client.findFirst({
    where: { id: clientId, userId: session.userId },
  });
  if (!client?.email) {
    return { success: false, error: "Client email not found" };
  }

  if (followUpId) {
    return sendFollowUpReminder(followUpId);
  }

  const openFollowUp = await db.followUp.findFirst({
    where: {
      clientId,
      client: { userId: session.userId },
      status: { not: FollowUpStatus.CLOSED },
    },
    orderBy: { nextFollowUpDate: "asc" },
  });

  if (openFollowUp) {
    return sendFollowUpReminder(openFollowUp.id);
  }

  return { success: false, error: "No open follow-up to send reminder for" };
}

export async function sendPaymentReminder(
  invoiceId: string,
  reminderType: ReminderType = ReminderType.DUE_DATE
): Promise<ActionResult> {
  const session = await requireSession();

  const templateMap: Record<ReminderType, string> = {
    [ReminderType.SEVEN_DAYS]: "7-Day Payment Reminder",
    [ReminderType.THREE_DAYS]: "3-Day Payment Reminder",
    [ReminderType.DUE_DATE]: "Due Date Reminder",
    [ReminderType.OVERDUE]: "Overdue Payment Reminder",
  };

  const result = await sendPaymentReminderEmail(
    session.userId,
    invoiceId,
    reminderType,
    templateMap[reminderType]
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to send" };
  }

  revalidatePath("/invoices");
  revalidatePath("/templates");
  return { success: true };
}

export async function sendFollowUpReminder(followUpId: string): Promise<ActionResult> {
  const session = await requireSession();
  const result = await sendFollowUpReminderEmail(session.userId, followUpId);

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to send" };
  }

  revalidatePath("/follow-ups");
  return { success: true };
}
