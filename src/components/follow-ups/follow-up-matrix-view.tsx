"use client";

import { format, parseISO } from "date-fns";
import { MessageCircle } from "lucide-react";
import type { FollowUpMatrixRow } from "@/app/actions/follow-ups";
import { SendEmailMenu } from "@/components/emails/send-email-menu";
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
import { cn, formatLocation } from "@/lib/utils";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

type FollowUpMatrixViewProps = {
  dates: string[];
  rows: FollowUpMatrixRow[];
  templates: Array<{ id: string; name: string }>;
};

const BASE_TABLE_MIN_WIDTH = 980;
const DATE_COLUMN_WIDTH = 136;

export function FollowUpMatrixView({ dates, rows, templates }: FollowUpMatrixViewProps) {
  const tableMinWidth = BASE_TABLE_MIN_WIDTH + dates.length * DATE_COLUMN_WIDTH;

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
    <div className="clay-table-wrap">
      <Table
        className="w-full"
        style={{ minWidth: tableMinWidth }}
        containerClassName="overflow-visible"
      >
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[108px] w-[108px] text-xs font-semibold px-3">
              Contact
            </TableHead>
            <TableHead className="min-w-[120px] w-[120px] text-xs font-semibold px-3">
              Company
            </TableHead>
            <TableHead className="min-w-[168px] w-[168px] text-xs font-semibold px-3">
              Email
            </TableHead>
            <TableHead className="min-w-[124px] w-[124px] text-xs font-semibold px-3">
              Phone
            </TableHead>
            <TableHead className="min-w-[148px] w-[148px] text-xs font-semibold px-3">
              Location
            </TableHead>
            <TableHead className="min-w-[96px] w-[96px] text-xs font-semibold px-3">
              Status
            </TableHead>
            <TableHead className="min-w-[128px] w-[128px] text-xs font-semibold px-3">
              Remark
            </TableHead>
            {dates.map((d, index) => (
              <TableHead
                key={d}
                className={cn(
                  "min-w-[136px] w-[136px] text-xs font-semibold text-center bg-[#f5f0e0] px-3 py-3",
                  index === 0 && "border-l border-[#e5e5e5]"
                )}
              >
                {format(parseISO(d), "MMM d")}
              </TableHead>
            ))}
            <TableHead className="min-w-[88px] w-[88px] text-xs font-semibold px-2">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const firstFollowUpId = Object.values(row.followUpsByDate)[0]?.id;
            return (
              <TableRow key={row.client.id}>
                <TableCell className="py-3 px-3 text-sm font-medium whitespace-nowrap">
                  {row.client.name}
                </TableCell>
                <TableCell className="py-3 px-3 text-sm text-[#6a6a6a] whitespace-nowrap">
                  {row.client.companyName ?? "—"}
                </TableCell>
                <TableCell className="py-3 px-3 text-sm text-[#6a6a6a] whitespace-nowrap">
                  {row.client.email ?? "—"}
                </TableCell>
                <TableCell className="py-3 px-3 text-sm text-[#6a6a6a] whitespace-nowrap">
                  {row.client.phone ?? "—"}
                </TableCell>
                <TableCell className="py-3 px-3 text-sm text-[#6a6a6a] whitespace-nowrap">
                  {formatLocation(row.client.country, row.client.state, row.client.city)}
                </TableCell>
                <TableCell className="py-3 px-3">
                  <StatusBadge status={row.client.status} />
                </TableCell>
                <TableCell className="py-3 px-3 text-sm text-[#6a6a6a] whitespace-nowrap">
                  {row.client.remark ?? "—"}
                </TableCell>
                {dates.map((d, index) => {
                  const cell = row.followUpsByDate[d];
                  return (
                    <TableCell
                      key={d}
                      className={cn(
                        "min-w-[136px] w-[136px] py-3 px-3 text-center align-top bg-[#faf5e8]/50",
                        index === 0 && "border-l border-[#e5e5e5]"
                      )}
                    >
                      {cell ? (
                        <div className="flex flex-col items-center gap-2 mx-auto w-full max-w-[120px]">
                          <StatusBadge status={cell.status} className="shrink-0" />
                          <p className="text-[11px] leading-snug text-[#6a6a6a] text-center line-clamp-2 break-words whitespace-normal w-full">
                            {cell.note}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[#e5e5e5]">—</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="py-3 px-2">
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}
