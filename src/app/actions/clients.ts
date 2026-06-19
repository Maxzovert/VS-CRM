"use server";

import { revalidatePath } from "next/cache";
import { ClientStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/get-session";
import { logActivity } from "@/lib/activity";
import { getClientOutstandingAmount, syncOverdueInvoices } from "@/lib/finance";
import { clientFilterSchema, clientSchema, transferToFollowUpSchema } from "@/lib/validations/client";
import type { ActionResult } from "@/lib/utils";

export async function createClient(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await db.client.create({
    data: {
      name: parsed.data.name,
      companyName: parsed.data.companyName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      country: parsed.data.country || null,
      state: parsed.data.state || null,
      city: parsed.data.city || null,
      website: parsed.data.website || null,
      remark: parsed.data.remark || null,
      status: parsed.data.status,
      userId: session.userId,
    },
  });

  await logActivity({
    userId: session.userId,
    clientId: client.id,
    type: "CLIENT_ADDED",
    description: `Client ${client.name} added`,
  });

  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true, data: { id: client.id } };
}

export async function updateClient(
  id: string,
  data: unknown
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.client.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  await db.client.update({
    where: { id },
    data: {
      name: parsed.data.name,
      companyName: parsed.data.companyName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      country: parsed.data.country || null,
      state: parsed.data.state || null,
      city: parsed.data.city || null,
      website: parsed.data.website || null,
      remark: parsed.data.remark || null,
      status: parsed.data.status,
    },
  });

  await logActivity({
    userId: session.userId,
    clientId: id,
    type: "CLIENT_UPDATED",
    description: `Client ${parsed.data.name} updated`,
  });

  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const existing = await db.client.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  await db.client.delete({ where: { id } });
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function bulkUpdateClientStatus(
  ids: string[],
  status: ClientStatus
): Promise<ActionResult> {
  const session = await requireSession();
  await db.client.updateMany({
    where: { id: { in: ids }, userId: session.userId },
    data: { status },
  });
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function bulkDeleteClients(ids: string[]): Promise<ActionResult> {
  const session = await requireSession();
  await db.client.deleteMany({
    where: { id: { in: ids }, userId: session.userId },
  });
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export type ClientListItem = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  remark: string | null;
  status: ClientStatus;
  lastContact: Date | null;
  nextFollowUp: Date | null;
  outstandingAmount: number;
};

export async function transferClientToFollowUp(
  data: unknown
): Promise<ActionResult<{ followUpId: string }>> {
  const session = await requireSession();
  const parsed = transferToFollowUpSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await db.client.findFirst({
    where: { id: parsed.data.clientId, userId: session.userId },
  });
  if (!client) return { success: false, error: "Client not found" };

  const note =
    parsed.data.note?.trim() ||
    client.remark ||
    `Follow-up with ${client.name}`;

  const followUp = await db.followUp.create({
    data: {
      clientId: client.id,
      note,
      nextFollowUpDate: parsed.data.nextFollowUpDate,
      status: "PENDING",
    },
  });

  await logActivity({
    userId: session.userId,
    clientId: client.id,
    type: "FOLLOWUP_CREATED",
    description: `Transferred to follow-up list for ${parsed.data.nextFollowUpDate.toISOString().split("T")[0]}`,
  });

  revalidatePath("/follow-ups");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true, data: { followUpId: followUp.id } };
}

export async function convertLeadToClient(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const client = await db.client.findFirst({
    where: { id, userId: session.userId },
  });
  if (!client) return { success: false, error: "Lead not found" };

  await db.client.update({
    where: { id },
    data: { status: ClientStatus.ACTIVE },
  });

  await logActivity({
    userId: session.userId,
    clientId: id,
    type: "CLIENT_UPDATED",
    description: `${client.name} converted to active client`,
  });

  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function getClients(params: unknown) {
  const session = await requireSession();
  await syncOverdueInvoices(session.userId);

  const parsed = clientFilterSchema.safeParse(params ?? {});
  const filters = parsed.success
    ? parsed.data
    : clientFilterSchema.parse({});

  const where: Prisma.ClientWhereInput = {
    userId: session.userId,
    ...(filters.status
      ? { status: filters.status }
      : filters.segment === "leads"
        ? { status: { in: [ClientStatus.LEAD, ClientStatus.LOST] } }
        : filters.segment === "clients"
          ? { status: { in: [ClientStatus.ACTIVE, ClientStatus.INACTIVE] } }
          : {}),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
        { country: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.ClientOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortOrder,
  };

  const [total, clients] = await Promise.all([
    db.client.count({ where }),
    db.client.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        followUps: {
          orderBy: { nextFollowUpDate: "desc" },
          take: 1,
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const items: ClientListItem[] = await Promise.all(
    clients.map(async (client) => ({
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      country: client.country,
      state: client.state,
      city: client.city,
      remark: client.remark,
      status: client.status,
      lastContact:
        client.activities[0]?.createdAt ??
        client.followUps[0]?.updatedAt ??
        null,
      nextFollowUp: client.followUps[0]?.nextFollowUpDate ?? null,
      outstandingAmount: await getClientOutstandingAmount(client.id),
    }))
  );

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

export async function getClientById(id: string) {
  const session = await requireSession();
  await syncOverdueInvoices(session.userId);

  const client = await db.client.findFirst({
    where: { id, userId: session.userId },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { dueDate: "desc" }, include: { payments: true } },
      followUps: { orderBy: { nextFollowUpDate: "asc" } },
      payments: { orderBy: { paymentDate: "desc" }, take: 10 },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!client) return null;

  const outstandingAmount = await getClientOutstandingAmount(id);
  return { ...client, outstandingAmount };
}

export async function getClientOptions() {
  const session = await requireSession();
  return db.client.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, companyName: true },
    orderBy: { name: "asc" },
  });
}
