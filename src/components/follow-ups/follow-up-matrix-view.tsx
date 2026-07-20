"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  getISOWeek,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import type { FollowUpMatrixRow } from "@/app/actions/follow-ups";
import { SendEmailMenu } from "@/components/emails/send-email-menu";
import { ClientNameLink } from "@/components/clients/client-name-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

type FollowUpMatrixViewProps = {
  dates: string[];
  rows: FollowUpMatrixRow[];
  templates: Array<{ id: string; name: string }>;
};

const WEEK_STARTS_ON = 1 as const; // Monday
const DAYS_IN_WEEK = 7;
const CONTACT_WIDTH = 160;
const STATUS_WIDTH = 96;
const REMARK_WIDTH = 140;
const ACTIONS_WIDTH = 88;
const DATE_COLUMN_WIDTH = 120;

function weekStart(date: Date) {
  return startOfWeek(startOfDay(date), { weekStartsOn: WEEK_STARTS_ON });
}

function buildWeekDates(weekAnchor: Date) {
  const start = weekStart(weekAnchor);
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) =>
    format(addDays(start, i), "yyyy-MM-dd")
  );
}

export function FollowUpMatrixView({
  dates: allDates,
  rows,
  templates,
}: FollowUpMatrixViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const thisWeekStart = useMemo(() => weekStart(today), [today]);

  const initialWeek = useMemo(() => {
    if (allDates.length === 0) return thisWeekStart;
    const todayKey = format(today, "yyyy-MM-dd");
    if (allDates.includes(todayKey)) return thisWeekStart;
    const upcoming = allDates.find((d) => d >= todayKey);
    return weekStart(parseISO(upcoming ?? allDates[0]));
  }, [allDates, today, thisWeekStart]);

  const [weekAnchor, setWeekAnchor] = useState(initialWeek);
  const weekDates = useMemo(() => buildWeekDates(weekAnchor), [weekAnchor]);
  const weekBegin = weekStart(weekAnchor);
  const weekEnd = addDays(weekBegin, DAYS_IN_WEEK - 1);
  const weekNumber = getISOWeek(weekBegin);
  const isCurrentWeek = isSameDay(weekBegin, thisWeekStart);

  const visibleRows = useMemo(() => {
    return rows.filter((row) =>
      weekDates.some((d) => Boolean(row.followUpsByDate[d]))
    );
  }, [rows, weekDates]);

  const outsideCount = useMemo(() => {
    const weekSet = new Set(weekDates);
    return allDates.filter((d) => !weekSet.has(d)).length;
  }, [allDates, weekDates]);

  const tableMinWidth =
    CONTACT_WIDTH +
    STATUS_WIDTH +
    REMARK_WIDTH +
    ACTIONS_WIDTH +
    weekDates.length * DATE_COLUMN_WIDTH;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-12 text-center">
        <p className="text-body-sm text-[#6a6a6a]">
          No follow-ups yet. Transfer leads from the Leads page to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0a0a0a]">
            Week {weekNumber}
            {isCurrentWeek ? " · This week" : ""}
          </p>
          <p className="text-xs text-[#6a6a6a]">
            Mon {format(weekBegin, "MMM d")} – Sun {format(weekEnd, "MMM d, yyyy")}
            {" · "}
            {visibleRows.length} client{visibleRows.length === 1 ? "" : "s"}
            {outsideCount > 0
              ? ` · ${outsideCount} date${outsideCount === 1 ? "" : "s"} in other weeks`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-[#e5e5e5] bg-[#fffaf0] px-3"
            onClick={() => setWeekAnchor((current) => addWeeks(weekStart(current), -1))}
            title="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-[#e5e5e5] bg-[#fffaf0] px-3"
            onClick={() => setWeekAnchor(thisWeekStart)}
            disabled={isCurrentWeek}
          >
            This week
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-[#e5e5e5] bg-[#fffaf0] px-3"
            onClick={() => setWeekAnchor((current) => addWeeks(weekStart(current), 1))}
            title="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="clay-table-wrap max-h-[min(70vh,720px)] overflow-auto">
        <Table
          className="w-full border-separate border-spacing-0"
          style={{ minWidth: tableMinWidth }}
          containerClassName="overflow-visible"
        >
          <TableHeader className="sticky top-0 z-30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-40 min-w-[160px] w-[160px] bg-[#faf5e8] text-xs font-semibold px-3 border-b border-[#e5e5e5]">
                Contact
              </TableHead>
              <TableHead className="sticky left-[160px] z-40 min-w-[96px] w-[96px] bg-[#faf5e8] text-xs font-semibold px-2 border-b border-[#e5e5e5]">
                Status
              </TableHead>
              <TableHead className="sticky left-[256px] z-40 min-w-[140px] w-[140px] bg-[#faf5e8] text-xs font-semibold px-2 border-b border-r border-[#e5e5e5]">
                Remark
              </TableHead>
              {weekDates.map((d, index) => {
                const day = parseISO(d);
                const isToday = isSameDay(day, today);
                return (
                  <TableHead
                    key={d}
                    className={cn(
                      "min-w-[120px] w-[120px] text-xs font-semibold text-center bg-[#f5f0e0] px-2 py-3 border-b border-[#e5e5e5]",
                      index === 0 && "border-l border-[#e5e5e5]",
                      isToday && "bg-[#ebe6d6] text-[#0a0a0a]"
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{format(day, "EEE")}</span>
                      <span className={cn(isToday && "font-bold")}>
                        {format(day, "MMM d")}
                      </span>
                    </div>
                  </TableHead>
                );
              })}
              <TableHead className="sticky right-0 z-40 min-w-[88px] w-[88px] bg-[#faf5e8] text-xs font-semibold px-2 border-b border-[#e5e5e5]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={weekDates.length + 4}
                  className="py-12 text-center text-sm text-[#6a6a6a]"
                >
                  No follow-ups this week. Use the arrows to browse other weeks.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const followUpInWeek = weekDates
                  .map((d) => row.followUpsByDate[d])
                  .find(Boolean);
                const firstFollowUpId = followUpInWeek?.id;

                return (
                  <TableRow key={row.client.id} className="hover:bg-[#faf5e8]/40">
                    <TableCell className="sticky left-0 z-20 min-w-[160px] w-[160px] bg-[#fffaf0] py-3 px-3 border-b border-[#e5e5e5]">
                      <div className="min-w-0">
                        <ClientNameLink
                          id={row.client.id}
                          name={row.client.name}
                          className="text-sm truncate block"
                        />
                        <p className="text-xs text-[#6a6a6a] truncate">
                          {row.client.companyName || row.client.phone || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="sticky left-[160px] z-20 min-w-[96px] w-[96px] bg-[#fffaf0] py-3 px-2 border-b border-[#e5e5e5]">
                      <StatusBadge status={row.client.status} />
                    </TableCell>
                    <TableCell className="sticky left-[256px] z-20 min-w-[140px] w-[140px] bg-[#fffaf0] py-3 px-2 border-b border-r border-[#e5e5e5]">
                      <p
                        className="text-xs text-[#6a6a6a] line-clamp-2 whitespace-normal wrap-break-word"
                        title={row.client.remark ?? undefined}
                      >
                        {row.client.remark?.trim() ? row.client.remark : "—"}
                      </p>
                    </TableCell>
                    {weekDates.map((d, index) => {
                      const cell = row.followUpsByDate[d];
                      const isToday = isSameDay(parseISO(d), today);
                      return (
                        <TableCell
                          key={d}
                          className={cn(
                            "min-w-[120px] w-[120px] py-3 px-2 text-center align-top border-b border-[#e5e5e5]",
                            index === 0 && "border-l border-[#e5e5e5]",
                            isToday ? "bg-[#f5f0e0]/70" : "bg-[#faf5e8]/40"
                          )}
                        >
                          {cell ? (
                            <div className="mx-auto flex w-full max-w-[108px] flex-col items-center gap-1.5">
                              <StatusBadge status={cell.status} className="shrink-0" />
                              <p className="w-full text-[11px] leading-snug text-[#6a6a6a] text-center line-clamp-2 wrap-break-word whitespace-normal">
                                {cell.note || "No note"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[#e5e5e5]">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="sticky right-0 z-20 min-w-[88px] w-[88px] bg-[#fffaf0] py-3 px-2 border-b border-[#e5e5e5]">
                      <div className="flex gap-1">
                        <SendEmailMenu
                          clientId={row.client.id}
                          followUpId={firstFollowUpId}
                          disabled={!row.client.email}
                          templates={templates}
                          buttonClassName="rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={!row.client.phone}
                          onClick={() => {
                            if (row.client.phone) {
                              openWhatsApp(row.client.phone);
                            } else {
                              toast.error("No phone number");
                            }
                          }}
                          title="Open WhatsApp"
                          className="rounded-lg text-[#25D366]"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
