import { z } from "zod";
import { ClientStatus } from "@prisma/client";

export const clientSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  remark: z.string().optional(),
  status: z.nativeEnum(ClientStatus),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const transferToFollowUpSchema = z.object({
  clientId: z.string().min(1),
  nextFollowUpDate: z.date(),
  note: z.string().optional(),
});

export type TransferToFollowUpInput = z.infer<typeof transferToFollowUpSchema>;

export const clientFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  segment: z.enum(["leads", "clients"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  sortBy: z
    .enum(["name", "companyName", "status", "createdAt", "city", "country"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
