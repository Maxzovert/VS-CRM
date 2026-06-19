"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { FollowUpStatus } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";

type FollowUpItem = {
  id: string;
  note: string;
  nextFollowUpDate: Date;
  status: FollowUpStatus;
  client: { id: string; name: string };
};

export function FollowUpCalendarView({ followUps }: { followUps: FollowUpItem[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = monthStart.getDay();
  const paddingDays = Array.from({ length: startPadding }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (startPadding - i));
    return d;
  });

  const allDays = [...paddingDays, ...days];

  const getFollowUpsForDay = (day: Date) =>
    followUps.filter((f) => isSameDay(new Date(f.nextFollowUpDate), day));

  const selectedFollowUps = selectedDate ? getFollowUpsForDay(selectedDate) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:items-start">
      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-5 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#0a0a0a]">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-lg border-[#e5e5e5]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-lg border-[#e5e5e5]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-[#6a6a6a] py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {allDays.map((day, i) => {
            const dayFollowUps = getFollowUpsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const inMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative h-11 rounded-xl text-sm transition-colors hover:bg-[#faf5e8]",
                  !inMonth && "text-[#6a6a6a]/40",
                  isSelected && "bg-[#f5f0e0] ring-1 ring-[#e5e5e5]"
                )}
              >
                {format(day, "d")}
                {dayFollowUps.length > 0 && inMonth && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayFollowUps.slice(0, 3).map((f) => (
                      <span
                        key={f.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          f.status === FollowUpStatus.CLOSED
                            ? "bg-zinc-500"
                            : f.status === FollowUpStatus.PENDING
                              ? "bg-amber-400"
                              : "bg-blue-400"
                        )}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-5 min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[#0a0a0a] mb-4">
          {selectedDate ? formatDate(selectedDate) : "Select a date"}
        </h3>
        {selectedFollowUps.length === 0 ? (
          <p className="text-sm text-[#6a6a6a]">No follow-ups on this day</p>
        ) : (
          <div className="space-y-3">
            {selectedFollowUps.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-[#e5e5e5] bg-[#faf5e8]/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/clients/${f.client.id}`}
                    className="text-sm font-medium text-[#0a0a0a] hover:underline"
                  >
                    {f.client.name}
                  </Link>
                  <StatusBadge status={f.status} className="shrink-0" />
                </div>
                <p className="text-sm text-[#6a6a6a] mt-2 leading-relaxed">{f.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
