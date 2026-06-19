import { Resend } from "resend";
import { EmailStatus, EmailType, ReminderType } from "@prisma/client";
import { db } from "@/lib/db";
import { renderTemplate, TemplateVariables } from "@/lib/validations/email-template";
import { logActivity } from "@/lib/activity";
import { format } from "date-fns";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

type SendEmailInput = {
  userId: string;
  clientId: string;
  to: string;
  subject: string;
  body: string;
  type: EmailType;
  templateId?: string;
  reminderType?: ReminderType;
  invoiceId?: string;
  followUpId?: string;
};

export async function sendEmail(input: SendEmailInput) {
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const client = getResend();

  const log = await db.emailLog.create({
    data: {
      userId: input.userId,
      clientId: input.clientId,
      templateId: input.templateId,
      to: input.to,
      subject: input.subject,
      body: input.body,
      type: input.type,
      status: EmailStatus.PENDING,
      reminderType: input.reminderType,
      invoiceId: input.invoiceId,
      followUpId: input.followUpId,
    },
  });

  if (!client) {
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: EmailStatus.FAILED },
    });
    return { success: false, error: "Resend not configured", logId: log.id };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.body.replace(/\n/g, "<br>"),
    });

    if (error) {
      await db.emailLog.update({
        where: { id: log.id },
        data: { status: EmailStatus.FAILED },
      });
      return {
        success: false,
        error: error.message ?? "Failed to send email",
        logId: log.id,
      };
    }

    if (!data?.id) {
      await db.emailLog.update({
        where: { id: log.id },
        data: { status: EmailStatus.FAILED },
      });
      return {
        success: false,
        error: "Resend did not return a message id",
        logId: log.id,
      };
    }

    await db.emailLog.update({
      where: { id: log.id },
      data: { status: EmailStatus.SENT },
    });

    await logActivity({
      userId: input.userId,
      clientId: input.clientId,
      type: "REMINDER_SENT",
      description: `Email sent: ${input.subject}`,
      metadata: { emailLogId: log.id, type: input.type },
    });

    return { success: true, logId: log.id };
  } catch (error) {
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: EmailStatus.FAILED },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
      logId: log.id,
    };
  }
}

export async function sendPaymentReminderEmail(
  userId: string,
  invoiceId: string,
  reminderType: ReminderType,
  templateName: string
) {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, client: { userId } },
    include: { client: true },
  });
  if (!invoice || !invoice.client.email) {
    return { success: false, error: "Invoice or client email not found" };
  }

  const existing = await db.emailLog.findFirst({
    where: { invoiceId, reminderType, status: EmailStatus.SENT },
  });
  if (existing) {
    return { success: false, error: "Reminder already sent" };
  }

  const template = await db.emailTemplate.findFirst({
    where: { userId, name: templateName },
  });
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const vars: TemplateVariables = {
    clientName: invoice.client.name,
    companyName: invoice.client.companyName ?? "",
    amount: Number(invoice.amount).toFixed(2),
    dueDate: format(invoice.dueDate, "MMM d, yyyy"),
    invoiceNumber: invoice.invoiceNumber,
  };

  return sendEmail({
    userId,
    clientId: invoice.clientId,
    to: invoice.client.email,
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
    type: EmailType.PAYMENT_REMINDER,
    templateId: template.id,
    reminderType,
    invoiceId,
  });
}

export async function sendFollowUpReminderEmail(
  userId: string,
  followUpId: string
) {
  const followUp = await db.followUp.findFirst({
    where: { id: followUpId, client: { userId } },
    include: { client: true },
  });
  if (!followUp || !followUp.client.email) {
    return { success: false, error: "Follow-up or client email not found" };
  }

  const template = await db.emailTemplate.findFirst({
    where: { userId, name: "Follow-up Reminder" },
  });
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const vars: TemplateVariables = {
    clientName: followUp.client.name,
    companyName: followUp.client.companyName ?? "",
    followUpNote: followUp.note,
    dueDate: format(followUp.nextFollowUpDate, "MMM d, yyyy"),
  };

  const result = await sendEmail({
    userId,
    clientId: followUp.clientId,
    to: followUp.client.email,
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
    type: EmailType.FOLLOWUP_REMINDER,
    templateId: template.id,
    followUpId,
  });

  if (result.success) {
    await db.followUp.update({
      where: { id: followUpId },
      data: { reminderSent: true },
    });
  }

  return result;
}
