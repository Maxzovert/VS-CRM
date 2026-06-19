import { redirect } from "next/navigation";
import { getSessionFromCookie } from "./session";
import { db } from "@/lib/db";

export async function getSession() {
  return getSessionFromCookie();
}

export async function requireSession() {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getCurrentUser() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    redirect("/login");
  }
  return user;
}
