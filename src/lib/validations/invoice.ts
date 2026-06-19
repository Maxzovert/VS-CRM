import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  amount: z
    .number({ message: "Enter a valid amount" })
    .refine((n) => Number.isFinite(n), "Enter a valid amount")
    .positive("Amount must be greater than zero"),
  dueDate: z.date({ message: "Due date is required" }),
  status: z.nativeEnum(InvoiceStatus),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
