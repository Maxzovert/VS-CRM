"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Plus, Trash2, ChevronLeft, ChevronRight, ArrowRightCircle, UserCheck } from "lucide-react";
import { ClientStatus } from "@prisma/client";
import type { ClientListItem } from "@/app/actions/clients";
import {
  bulkDeleteClients,
  bulkUpdateClientStatus,
  convertLeadToClient,
} from "@/app/actions/clients";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatCurrency, formatDate, formatLocation } from "@/lib/utils";
import { ClientSlideOver } from "./client-slide-over";
import { ClientFormDialog } from "./client-form-dialog";
import { TransferFollowUpDialog } from "./transfer-follow-up-dialog";
import { toast } from "sonner";

type ClientsTableProps = {
  variant: "leads" | "clients";
  data: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const LEAD_STATUSES = [ClientStatus.LEAD, ClientStatus.LOST];
const CLIENT_STATUSES = [ClientStatus.ACTIVE, ClientStatus.INACTIVE];

const LEAD_COLUMN_WIDTHS: Record<string, string> = {
  select: "w-10",
  name: "w-[9%]",
  companyName: "w-[9%]",
  email: "w-[13%]",
  phone: "w-[10%]",
  location: "w-[11%]",
  status: "w-[11%]",
  remark: "w-[12%]",
  actions: "w-52",
};

const CLIENT_COLUMN_WIDTHS: Record<string, string> = {
  select: "w-10",
  name: "w-[10%]",
  companyName: "w-[10%]",
  email: "w-[15%]",
  phone: "w-[10%]",
  location: "w-[12%]",
  status: "w-[8%]",
  outstandingAmount: "w-[9%]",
  lastContact: "w-[11%]",
  nextFollowUp: "w-[11%]",
  actions: "w-32",
};

export function ClientsTable({
  variant,
  data,
  total,
  page,
  pageSize,
  totalPages,
}: ClientsTableProps) {
  const isLeads = variant === "leads";
  const basePath = isLeads ? "/leads" : "/clients";
  const defaultStatus = isLeads ? ClientStatus.LEAD : ClientStatus.ACTIVE;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [transferClient, setTransferClient] = useState<ClientListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, basePath]
  );

  const handleLeadStatusChange = (id: string, status: ClientStatus) => {
    startTransition(async () => {
      const result = await bulkUpdateClientStatus([id], status);
      if (result.success) {
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns: ColumnDef<ClientListItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    },
    {
      accessorKey: "name",
      header: "Contact",
      cell: ({ row }) => (
        <span className={cn("text-sm font-medium text-[#0a0a0a]", isLeads && "truncate block")}>
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <span className={cn("text-sm text-[#6a6a6a]", isLeads && "truncate block")}>
          {row.original.companyName ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className={cn("text-sm text-[#6a6a6a]", isLeads && "truncate block")}>
          {row.original.email ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className={cn("text-sm text-[#6a6a6a]", isLeads && "truncate block")}>
          {row.original.phone ?? "—"}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className={cn("text-sm text-[#6a6a6a]", isLeads && "truncate block")}>
          {formatLocation(row.original.country, row.original.state, row.original.city)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        isLeads ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={row.original.status}
              onValueChange={(v) => handleLeadStatusChange(row.original.id, v as ClientStatus)}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-full max-w-[120px] rounded-lg border-[#e5e5e5] bg-[#fffaf0] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <StatusBadge status={row.original.status} />
        ),
    },
    ...(isLeads
      ? ([
          {
            accessorKey: "remark",
            header: "Remark",
            cell: ({ row }) => (
              <span className="text-sm text-[#6a6a6a] truncate block">
                {row.original.remark ?? "—"}
              </span>
            ),
          },
        ] as ColumnDef<ClientListItem>[])
      : ([
          {
            accessorKey: "outstandingAmount",
            header: "Outstanding",
            cell: ({ row }) => (
              <span className="text-sm font-semibold tabular-nums text-[#0a0a0a]">
                {formatCurrency(row.original.outstandingAmount)}
              </span>
            ),
          },
          {
            accessorKey: "lastContact",
            header: "Last Contact",
            cell: ({ row }) => (
              <span className="text-sm text-[#6a6a6a]">
                {formatDate(row.original.lastContact)}
              </span>
            ),
          },
          {
            accessorKey: "nextFollowUp",
            header: "Next Follow-up",
            cell: ({ row }) => (
              <span className="text-sm text-[#6a6a6a]">
                {formatDate(row.original.nextFollowUp)}
              </span>
            ),
          },
        ] as ColumnDef<ClientListItem>[])),
    {
      id: "actions",
      header: isLeads ? "Actions" : "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isLeads && row.original.status === ClientStatus.LEAD && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-[#1a3a3a] hover:bg-[#a4d4c5]/30 shrink-0"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await convertLeadToClient(row.original.id);
                  if (result.success) {
                    toast.success(`${row.original.name} converted to client`);
                    router.refresh();
                  } else toast.error(result.error);
                });
              }}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Convert
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-[#0a0a0a] hover:bg-[#faf5e8] shrink-0"
            onClick={() => setTransferClient(row.original)}
          >
            <ArrowRightCircle className="h-4 w-4 mr-1" />
            Follow-up
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    getRowId: (row) => row.id,
  });

  const selectedIds = Object.keys(rowSelection);

  const handleBulkStatus = (status: ClientStatus) => {
    startTransition(async () => {
      const result = await bulkUpdateClientStatus(selectedIds, status);
      if (result.success) {
        toast.success(isLeads ? "Leads updated" : "Clients updated");
        setRowSelection({});
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBulkDelete = () => {
    if (!confirm("Delete selected leads?")) return;
    startTransition(async () => {
      const result = await bulkDeleteClients(selectedIds);
      if (result.success) {
        toast.success(isLeads ? "Leads deleted" : "Clients deleted");
        setRowSelection({});
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isLeads ? "Leads" : "Clients"}
        description={
          isLeads
            ? `${total} prospects in your pipeline`
            : `${total} active & converted clients`
        }
        action={
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-11 px-5 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLeads ? "Add Lead" : "Add Client"}
          </Button>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search name, company, email, phone, location..."
          className="h-11 w-72 rounded-xl border-[#e5e5e5] bg-[#fffaf0]"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            const timeout = setTimeout(
              () => updateParams({ search: value || undefined, page: "1" }),
              300
            );
            return () => clearTimeout(timeout);
          }}
        />
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) =>
            updateParams({
              status: !v || v === "all" ? undefined : v,
              page: "1",
            })
          }
        >
          <SelectTrigger className="h-11 w-36 rounded-xl border-[#e5e5e5]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(isLeads ? LEAD_STATUSES : CLIENT_STATUSES).map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-[#6a6a6a] mr-2">
              {selectedIds.length} selected
            </span>
            {isLeads && (
              <Select onValueChange={(v) => handleBulkStatus(v as ClientStatus)}>
                <SelectTrigger className="h-9 w-28 text-xs rounded-xl">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="destructive"
              size="xs"
              onClick={handleBulkDelete}
              disabled={isPending}
              className="rounded-lg"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="clay-table-wrap">
        <Table className="table-fixed w-full">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const colKey = header.column.id;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-10 text-xs font-semibold px-3",
                        isLeads
                          ? LEAD_COLUMN_WIDTHS[colKey]
                          : CLIENT_COLUMN_WIDTHS[colKey]
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-[#6a6a6a]"
                >
                  No {isLeads ? "leads" : "clients"} found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => setSelectedClientId(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === "actions"
                          ? "py-2.5 px-2 whitespace-nowrap"
                          : "py-2.5 px-3",
                        cell.column.id !== "actions" &&
                          cell.column.id !== "select" &&
                          cell.column.id !== "status" &&
                          (isLeads ? "max-w-0 truncate" : "truncate")
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6a6a6a]">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="rounded-lg"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="rounded-lg"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {selectedClientId && (
        <ClientSlideOver
          clientId={selectedClientId}
          open={!!selectedClientId}
          onOpenChange={(open) => !open && setSelectedClientId(null)}
        />
      )}

      <ClientFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultValues={{ status: defaultStatus }}
        variant={variant}
      />

      <TransferFollowUpDialog
        open={!!transferClient}
        onOpenChange={(open) => !open && setTransferClient(null)}
        client={transferClient}
      />
    </div>
  );
}
