import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const projectSchema = z.object({
  clientId: z.string().min(1),
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  totalAmount: z.number().min(0),
  paidAmount: z.number().min(0).optional(),
  startDate: z.date().optional().nullable(),
  deadline: z.date().optional().nullable(),
  status: z.nativeEnum(ProjectStatus),
});

export type ProjectInput = z.infer<typeof projectSchema>;
