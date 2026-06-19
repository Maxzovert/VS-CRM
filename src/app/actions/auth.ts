"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/lib/utils";

export async function register(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { success: false, error: "Email already registered" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  await createSession({ userId: user.id, email: user.email });
  redirect("/");
}

export async function login(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  await createSession({ userId: user.id, email: user.email });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
