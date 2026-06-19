"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FollowUpStatus } from "@prisma/client";
import { updateFollowUpStatus } from "@/app/actions/follow-ups";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";

type FollowUpItem = {
  id: string;
  note: string;
  nextFollowUpDate: Date;
  status: FollowUpStatus;
  client: { id: string; name: string };
};

const columns: FollowUpStatus[] = [
  FollowUpStatus.PENDING,
  FollowUpStatus.CONTACTED,
  FollowUpStatus.WAITING,
  FollowUpStatus.CLOSED,
];

function FollowUpCard({ item }: { item: FollowUpItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-xl border border-[#e5e5e5] bg-[#fffaf0] p-3 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <Link
        href={`/clients/${item.client.id}`}
        className="text-sm font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {item.client.name}
      </Link>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.note}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5">{formatDate(item.nextFollowUpDate)}</p>
    </div>
  );
}

function KanbanColumn({
  status,
  items,
}: {
  status: FollowUpStatus;
  items: FollowUpItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[220px] flex-1">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {status.replace(/_/g, " ")}
        </h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-2xl border border-[#e5e5e5] bg-[#faf5e8] p-3 min-h-[300px] transition-colors",
          isOver && "border-primary/30 bg-muted/40"
        )}
      >
        {items.map((item) => (
          <FollowUpCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function FollowUpKanbanView({ followUps }: { followUps: FollowUpItem[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticFollowUps, setOptimisticFollowUps] = useOptimistic(
    followUps,
    (state, update: { id: string; status: FollowUpStatus }) =>
      state.map((f) => (f.id === update.id ? { ...f, status: update.status } : f))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeItem = optimisticFollowUps.find((f) => f.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as FollowUpStatus;
    const item = optimisticFollowUps.find((f) => f.id === active.id);
    if (!item || item.status === newStatus) return;
    if (!columns.includes(newStatus)) return;

    startTransition(async () => {
      setOptimisticFollowUps({ id: item.id, status: newStatus });
      const result = await updateFollowUpStatus(item.id, newStatus);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={optimisticFollowUps.filter((f) => f.status === status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? <FollowUpCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
