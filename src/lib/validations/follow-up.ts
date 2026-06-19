import { z } from "zod";
import { FollowUpStatus } from "@prisma/client";

export const followUpSchema = z.object({
  clientId: z.string().min(1),
  note: z.string().min(1, "Note is required"),
  nextFollowUpDate: z.date(),
  status: z.nativeEnum(FollowUpStatus),
});

export type FollowUpInput = z.infer<typeof followUpSchema>;
