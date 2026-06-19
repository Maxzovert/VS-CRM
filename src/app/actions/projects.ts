"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/get-session";
import { logActivity } from "@/lib/activity";
import { projectSchema } from "@/lib/validations/project";
import type { ActionResult } from "@/lib/utils";

async function verifyClientOwnership(clientId: string, userId: string) {
  return db.client.findFirst({ where: { id: clientId, userId } });
}

export async function createProject(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await verifyClientOwnership(parsed.data.clientId, session.userId);
  if (!client) return { success: false, error: "Client not found" };

  const project = await db.project.create({
    data: {
      clientId: parsed.data.clientId,
      projectName: parsed.data.projectName,
      description: parsed.data.description,
      totalAmount: parsed.data.totalAmount,
      paidAmount: parsed.data.paidAmount ?? 0,
      startDate: parsed.data.startDate,
      deadline: parsed.data.deadline,
      status: parsed.data.status,
    },
  });

  await logActivity({
    userId: session.userId,
    clientId: parsed.data.clientId,
    type: "PROJECT_CREATED",
    description: `Project "${project.projectName}" created`,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { success: true, data: { id: project.id } };
}

export async function updateProject(id: string, data: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const project = await db.project.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!project) return { success: false, error: "Project not found" };

  await db.project.update({
    where: { id },
    data: {
      projectName: parsed.data.projectName,
      description: parsed.data.description,
      totalAmount: parsed.data.totalAmount,
      paidAmount: parsed.data.paidAmount ?? project.paidAmount,
      startDate: parsed.data.startDate,
      deadline: parsed.data.deadline,
      status: parsed.data.status,
    },
  });

  await logActivity({
    userId: session.userId,
    clientId: project.clientId,
    type: "PROJECT_UPDATED",
    description: `Project "${parsed.data.projectName}" updated`,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${project.clientId}`);
  return { success: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { id, client: { userId: session.userId } },
  });
  if (!project) return { success: false, error: "Project not found" };

  await db.project.delete({ where: { id } });
  revalidatePath("/clients");
  revalidatePath(`/clients/${project.clientId}`);
  return { success: true };
}

export async function getProjects() {
  const session = await requireSession();
  return db.project.findMany({
    where: { client: { userId: session.userId } },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
