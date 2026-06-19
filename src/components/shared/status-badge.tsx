import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  LEAD: "bg-[#b8a4ed]/30 text-[#0a0a0a]",
  ACTIVE: "bg-[#a4d4c5]/40 text-[#0a0a0a]",
  INACTIVE: "bg-[#f5f0e0] text-[#6a6a6a]",
  LOST: "bg-[#ff6b5a]/20 text-[#ef4444]",
  PLANNING: "bg-[#f5f0e0] text-[#6a6a6a]",
  IN_PROGRESS: "bg-[#ffb084]/40 text-[#0a0a0a]",
  COMPLETED: "bg-[#a4d4c5]/40 text-[#0a0a0a]",
  ON_HOLD: "bg-[#e8b94a]/30 text-[#0a0a0a]",
  PENDING: "bg-[#e8b94a]/30 text-[#0a0a0a]",
  PAID: "bg-[#a4d4c5]/40 text-[#15803d]",
  OVERDUE: "bg-[#ff6b5a]/20 text-[#ef4444]",
  CONTACTED: "bg-[#ffb084]/40 text-[#0a0a0a]",
  WAITING: "bg-[#b8a4ed]/30 text-[#0a0a0a]",
  CLOSED: "bg-[#f5f0e0] text-[#6a6a6a]",
};

function formatLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-caption whitespace-nowrap",
        statusStyles[status] ?? "bg-[#f5f0e0] text-[#6a6a6a]",
        className
      )}
    >
      {formatLabel(status)}
    </span>
  );
}
