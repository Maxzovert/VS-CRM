import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatLocation(
  country?: string | null,
  state?: string | null,
  city?: string | null
) {
  const parts = [city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelative(date: Date | string | null | undefined) {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
