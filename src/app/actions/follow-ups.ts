"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { FollowUpStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/get-session";
import { logActivity } from "@/lib/activity";
import { followUpSchema } from "@/lib/validations/follow-up";
import type { ActionResult } from "@/lib/utils";

export async function createFollowUp(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = followUpSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await db.client.findFirst({
    where: { id: parsed.data.clientId, userId: session.userId },
  });
  if (!client) return { success: false, error: "Client not found" };

  const followUp = await db.followUp.create({
    data: parsed.data,
  });

  await logActivity({
    userId: session.userId,
    clientId: parsed.data.clientId,
    type: "FOLLOWUP_CREATED",
    description: `Follow-up scheduled for ${parsed.data.nextFollowUpDate.toISOString().split("T")[0]}`,
  });

  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true, data: { id: followUp.id } };
}

export async function updateFollowUp(id: string, data: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = followUpSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const followUp = await db.followUp.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!followUp) return { success: false, error: "Follow-up not found" };

  await db.followUp.update({
    where: { id },
    data: {
      note: parsed.data.note,
      nextFollowUpDate: parsed.data.nextFollowUpDate,
      status: parsed.data.status,
      reminderSent:
        parsed.data.status === FollowUpStatus.CLOSED ? true : followUp.reminderSent,
    },
  });

  const activityType =
    parsed.data.status === FollowUpStatus.CLOSED
      ? "FOLLOWUP_COMPLETED"
      : "FOLLOWUP_UPDATED";

  await logActivity({
    userId: session.userId,
    clientId: followUp.clientId,
    type: activityType,
    description:
      parsed.data.status === FollowUpStatus.CLOSED
        ? "Follow-up marked as closed"
        : "Follow-up updated",
  });

  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function updateFollowUpStatus(
  id: string,
  status: FollowUpStatus
): Promise<ActionResult> {
  const session = await requireSession();
  const followUp = await db.followUp.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!followUp) return { success: false, error: "Follow-up not found" };

  await db.followUp.update({
    where: { id },
    data: {
      status,
      reminderSent: status === FollowUpStatus.CLOSED ? true : followUp.reminderSent,
    },
  });

  if (status === FollowUpStatus.CLOSED) {
    await logActivity({
      userId: session.userId,
      clientId: followUp.clientId,
      type: "FOLLOWUP_COMPLETED",
      description: "Follow-up marked as closed",
    });
  }

  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function deleteFollowUp(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const followUp = await db.followUp.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!followUp) return { success: false, error: "Follow-up not found" };

  await db.followUp.delete({ where: { id } });
  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function getFollowUps(filters?: {
  status?: FollowUpStatus;
  clientId?: string;
}) {
  const session = await requireSession();

  return db.followUp.findMany({
    where: {
      client: { userId: session.userId },
      ...(filters?.status && { status: filters.status }),
      ...(filters?.clientId && { clientId: filters.clientId }),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          country: true,
          state: true,
          city: true,
          remark: true,
          status: true,
        },
      },
    },
    orderBy: { nextFollowUpDate: "asc" },
  });
}

export type FollowUpMatrixCell = {
  id: string;
  note: string;
  status: FollowUpStatus;
};

export type FollowUpMatrixRow = {
  client: {
    id: string;
    name: string;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    remark: string | null;
    status: string;
  };
  followUpsByDate: Record<string, FollowUpMatrixCell>;
};

export async function getFollowUpMatrix() {
  const session = await requireSession();

  const followUps = await db.followUp.findMany({
    where: {
      client: { userId: session.userId },
      status: { not: FollowUpStatus.CLOSED },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          country: true,
          state: true,
          city: true,
          remark: true,
          status: true,
        },
      },
    },
    orderBy: { nextFollowUpDate: "asc" },
  });

  const datesSet = new Set<string>();
  const rowsMap = new Map<string, FollowUpMatrixRow>();

  for (const fu of followUps) {
    const dateKey = format(new Date(fu.nextFollowUpDate), "yyyy-MM-dd");
    datesSet.add(dateKey);

    if (!rowsMap.has(fu.clientId)) {
      rowsMap.set(fu.clientId, {
        client: fu.client,
        followUpsByDate: {},
      });
    }

    const row = rowsMap.get(fu.clientId)!;
    row.followUpsByDate[dateKey] = {
      id: fu.id,
      note: fu.note,
      status: fu.status,
    };
  }

  return {
    dates: Array.from(datesSet).sort(),
    rows: Array.from(rowsMap.values()),
  };
}

export async function getTodaysFollowUps() {
  const session = await requireSession();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return db.followUp.findMany({
    where: {
      client: { userId: session.userId },
      status: { not: FollowUpStatus.CLOSED },
      nextFollowUpDate: { gte: today, lt: tomorrow },
    },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { nextFollowUpDate: "asc" },
  });
}
