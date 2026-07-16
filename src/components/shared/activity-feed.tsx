import {
  UserPlus,
  FileText,
  CreditCard,
  Mail,
  MessageSquare,
  FolderKanban,
  Pencil,
} from "lucide-react";
import { ActivityType } from "@prisma/client";
import { ClientNameLink } from "@/components/clients/client-name-link";
import { formatRelative } from "@/lib/utils";

const activityIcons: Record<ActivityType, typeof UserPlus> = {
  CLIENT_ADDED: UserPlus,
  CLIENT_UPDATED: Pencil,
  INVOICE_CREATED: FileText,
  INVOICE_UPDATED: FileText,
  PAYMENT_RECEIVED: CreditCard,
  REMINDER_SENT: Mail,
  FOLLOWUP_CREATED: MessageSquare,
  FOLLOWUP_COMPLETED: MessageSquare,
  FOLLOWUP_UPDATED: MessageSquare,
  PROJECT_CREATED: FolderKanban,
  PROJECT_UPDATED: FolderKanban,
};

const iconColors: Record<ActivityType, string> = {
  CLIENT_ADDED: "bg-[#b8a4ed]",
  CLIENT_UPDATED: "bg-[#f5f0e0]",
  INVOICE_CREATED: "bg-[#ffb084]",
  INVOICE_UPDATED: "bg-[#ffb084]",
  PAYMENT_RECEIVED: "bg-[#a4d4c5]",
  REMINDER_SENT: "bg-[#ff4d8b] text-white",
  FOLLOWUP_CREATED: "bg-[#e8b94a]",
  FOLLOWUP_COMPLETED: "bg-[#a4d4c5]",
  FOLLOWUP_UPDATED: "bg-[#e8b94a]",
  PROJECT_CREATED: "bg-[#1a3a3a] text-white",
  PROJECT_UPDATED: "bg-[#1a3a3a] text-white",
};

type ActivityItem = {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: Date;
  client?: { id: string; name: string };
  clientId?: string;
  clientName?: string;
};

export function ActivityFeed({
  activities,
  compact = false,
}: {
  activities: ActivityItem[];
  compact?: boolean;
}) {
  if (activities.length === 0) {
    return (
      <p className="text-body-sm text-[#6a6a6a] py-4 text-center">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type] ?? MessageSquare;
        const clientId = activity.client?.id ?? activity.clientId;
        const clientName = activity.client?.name ?? activity.clientName;
        return (
          <div
            key={activity.id}
            className="flex gap-3 py-3 border-b border-[#e5e5e5] last:border-0"
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconColors[activity.type] ?? "bg-[#f5f0e0]"}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={
                  compact
                    ? "text-body-sm leading-relaxed text-[#0a0a0a]"
                    : "text-sm leading-relaxed text-[#0a0a0a]"
                }
              >
                {activity.description}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {clientId && clientName && (
                  <>
                    <ClientNameLink
                      id={clientId}
                      name={clientName}
                      className="text-caption text-[#6a6a6a] hover:text-[#0a0a0a] font-normal"
                    />
                    <span className="text-[#e5e5e5]">·</span>
                  </>
                )}
                <span className="text-caption text-[#9a9a9a]">
                  {formatRelative(activity.createdAt)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
