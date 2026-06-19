import { ActivityType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type LogActivityInput = {
  userId: string;
  clientId: string;
  type: ActivityType;
  description: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logActivity(input: LogActivityInput) {
  return db.activity.create({
    data: {
      userId: input.userId,
      clientId: input.clientId,
      type: input.type,
      description: input.description,
      metadata: input.metadata,
    },
  });
}
