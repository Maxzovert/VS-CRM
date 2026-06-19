import { NextRequest, NextResponse } from "next/server";
import {
  addDays,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";
import { EmailStatus, FollowUpStatus, InvoiceStatus, ReminderType } from "@prisma/client";
import { db } from "@/lib/db";
import { sendFollowUpReminderEmail, sendPaymentReminderEmail } from "@/lib/email/resend";

function authorize(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const results = { paymentReminders: 0, followUpReminders: 0, errors: [] as string[] };

  const users = await db.user.findMany({ select: { id: true } });

  for (const user of users) {
    const sevenDays = endOfDay(addDays(today, 7));
    const threeDays = endOfDay(addDays(today, 3));
    const todayEnd = endOfDay(today);

    const reminderChecks: Array<{
      type: ReminderType;
      template: string;
      dueStart: Date;
      dueEnd: Date;
    }> = [
      {
        type: ReminderType.SEVEN_DAYS,
        template: "7-Day Payment Reminder",
        dueStart: startOfDay(addDays(today, 7)),
        dueEnd: sevenDays,
      },
      {
        type: ReminderType.THREE_DAYS,
        template: "3-Day Payment Reminder",
        dueStart: startOfDay(addDays(today, 3)),
        dueEnd: threeDays,
      },
      {
        type: ReminderType.DUE_DATE,
        template: "Due Date Reminder",
        dueStart: today,
        dueEnd: todayEnd,
      },
    ];

    for (const check of reminderChecks) {
      const invoices = await db.invoice.findMany({
        where: {
          client: { userId: user.id },
          status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
          dueDate: { gte: check.dueStart, lte: check.dueEnd },
        },
      });

      for (const invoice of invoices) {
        const sent = await db.emailLog.findFirst({
          where: {
            invoiceId: invoice.id,
            reminderType: check.type,
            status: EmailStatus.SENT,
          },
        });
        if (sent) continue;

        const result = await sendPaymentReminderEmail(
          user.id,
          invoice.id,
          check.type,
          check.template
        );
        if (result.success) results.paymentReminders++;
        else if (result.error) results.errors.push(result.error);
      }
    }

    const overdueInvoices = await db.invoice.findMany({
      where: {
        client: { userId: user.id },
        status: InvoiceStatus.OVERDUE,
        dueDate: { lt: today },
      },
    });

    for (const invoice of overdueInvoices) {
      const recent = await db.emailLog.findFirst({
        where: {
          invoiceId: invoice.id,
          reminderType: ReminderType.OVERDUE,
          status: EmailStatus.SENT,
          sentAt: { gte: subDays(today, 7) },
        },
      });
      if (recent) continue;

      const result = await sendPaymentReminderEmail(
        user.id,
        invoice.id,
        ReminderType.OVERDUE,
        "Overdue Payment Reminder"
      );
      if (result.success) results.paymentReminders++;
      else if (result.error) results.errors.push(result.error);
    }

    const followUps = await db.followUp.findMany({
      where: {
        client: { userId: user.id },
        status: { not: FollowUpStatus.CLOSED },
        nextFollowUpDate: { gte: today, lte: todayEnd },
        reminderSent: false,
      },
    });

    for (const followUp of followUps) {
      const result = await sendFollowUpReminderEmail(user.id, followUp.id);
      if (result.success) results.followUpReminders++;
      else if (result.error) results.errors.push(result.error);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
