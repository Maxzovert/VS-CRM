import { z } from "zod";

export const paymentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  invoiceId: z.string().optional().nullable(),
  amount: z
    .number({ message: "Enter a valid amount" })
    .refine((n) => Number.isFinite(n), "Enter a valid amount")
    .positive("Amount must be greater than zero"),
  paymentDate: z.date({ message: "Payment date is required" }),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
