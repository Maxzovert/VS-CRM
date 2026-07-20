"use server";

import { revalidatePath } from "next/cache";
import { ClientStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/get-session";
import { logActivity } from "@/lib/activity";
import { mapCsvRowToDataEntry, parseCsv, toCsv } from "@/lib/csv";
import {
  DATA_ENTRY_CSV_HEADERS,
  dataEntryFilterSchema,
  dataEntrySchema,
} from "@/lib/validations/data-entry";
import type { ActionResult } from "@/lib/utils";

function normalizeWebsite(url?: string | null) {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function buildLeadNotes(instagram?: string | null) {
  if (!instagram?.trim()) return null;
  const handle = instagram.trim();
  return handle.startsWith("@") ? `Instagram: ${handle}` : `Instagram: @${handle.replace(/^@/, "")}`;
}

export async function getDataEntries(params: unknown) {
  const session = await requireSession();
  const parsed = dataEntryFilterSchema.safeParse(params ?? {});
  const filters = parsed.success ? parsed.data : dataEntryFilterSchema.parse({});

  const where: Prisma.DataEntryWhereInput = {
    userId: session.userId,
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
        { instagram: { contains: filters.search, mode: "insensitive" } },
        { website: { contains: filters.search, mode: "insensitive" } },
        { remark: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [total, items] = await Promise.all([
    db.dataEntry.count({ where }),
    db.dataEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function createDataEntry(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = dataEntrySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const entry = await db.dataEntry.create({
    data: { ...parsed.data, userId: session.userId },
  });

  revalidatePath("/data");
  return { success: true, data: { id: entry.id } };
}

export async function updateDataEntry(id: string, data: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = dataEntrySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.dataEntry.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return { success: false, error: "Row not found" };

  await db.dataEntry.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/data");
  return { success: true };
}

export async function deleteDataEntry(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const result = await db.dataEntry.deleteMany({
    where: { id, userId: session.userId },
  });
  if (result.count === 0) return { success: false, error: "Row not found" };

  revalidatePath("/data");
  return { success: true };
}

export async function importDataEntriesFromCsv(
  csvText: string
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const session = await requireSession();
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { success: false, error: "CSV file is empty" };
  }

  const [headerRow, ...dataRows] = rows;
  const toCreate: Array<{
    userId: string;
    name: string;
    businessName: string | null;
    location: string | null;
    instagram: string | null;
    website: string | null;
    remark: string | null;
  }> = [];

  let skipped = 0;

  for (const row of dataRows) {
    const mapped = mapCsvRowToDataEntry(headerRow, row);
    const parsed = dataEntrySchema.safeParse(mapped);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    toCreate.push({
      userId: session.userId,
      name: parsed.data.name,
      businessName: parsed.data.businessName || null,
      location: parsed.data.location || null,
      instagram: parsed.data.instagram || null,
      website: parsed.data.website || null,
      remark: parsed.data.remark || null,
    });
  }

  if (toCreate.length === 0) {
    return {
      success: false,
      error: "No valid rows found. Ensure CSV has a Name column and header row.",
    };
  }

  await db.dataEntry.createMany({ data: toCreate });

  revalidatePath("/data");
  return { success: true, data: { imported: toCreate.length, skipped } };
}

export async function exportDataEntriesCsv(): Promise<ActionResult<{ csv: string }>> {
  const session = await requireSession();
  const entries = await db.dataEntry.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    [...DATA_ENTRY_CSV_HEADERS],
    entries.map((e) => [
      e.name,
      e.businessName ?? "",
      e.location ?? "",
      e.instagram ?? "",
      e.website ?? "",
      e.remark ?? "",
    ])
  );

  return { success: true, data: { csv } };
}

export async function transferDataEntryToLead(
  id: string
): Promise<ActionResult<{ clientId: string }>> {
  const session = await requireSession();

  const entry = await db.dataEntry.findFirst({
    where: { id, userId: session.userId },
  });
  if (!entry) return { success: false, error: "Row not found" };

  if (entry.leadClientId) {
    const existing = await db.client.findFirst({
      where: { id: entry.leadClientId, userId: session.userId },
    });
    if (existing) {
      return { success: true, data: { clientId: existing.id } };
    }
  }

  const client = await db.client.create({
    data: {
      userId: session.userId,
      name: entry.name,
      companyName: entry.businessName || null,
      city: entry.location || null,
      website: normalizeWebsite(entry.website),
      notes: buildLeadNotes(entry.instagram),
      remark: entry.remark || null,
      status: ClientStatus.LEAD,
    },
  });

  await db.dataEntry.update({
    where: { id: entry.id },
    data: { leadClientId: client.id },
  });

  await logActivity({
    userId: session.userId,
    clientId: client.id,
    type: "CLIENT_ADDED",
    description: `Lead created from Data: ${entry.name}`,
  });

  revalidatePath("/data");
  revalidatePath("/leads");
  revalidatePath("/");
  return { success: true, data: { clientId: client.id } };
}
