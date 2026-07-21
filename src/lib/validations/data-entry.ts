import { z } from "zod";

export const dataEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  businessName: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  remark: z.string().optional(),
});

export type DataEntryInput = z.infer<typeof dataEntrySchema>;

export const dataEntryFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(50),
});

export const DATA_ENTRY_CSV_HEADERS = [
  "Name",
  "Business Name",
  "Location",
  "Phone",
  "Instagram",
  "Website",
  "Remark",
] as const;
