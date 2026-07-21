"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import type { DataEntry } from "@prisma/client";
import {
  createDataEntry,
  deleteDataEntry,
  exportDataEntriesCsv,
  importDataEntriesFromCsv,
  transferDataEntryToLead,
  updateDataEntry,
} from "@/app/actions/data-entries";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DATA_ENTRY_CSV_HEADERS, type DataEntryInput } from "@/lib/validations/data-entry";
import { toast } from "sonner";

type DataPageClientProps = {
  entries: DataEntry[];
  total: number;
  page: number;
  totalPages: number;
};

const emptyForm: DataEntryInput = {
  name: "",
  businessName: "",
  location: "",
  phone: "",
  instagram: "",
  website: "",
  remark: "",
};

function RemarkCell({ remark }: { remark: string | null | undefined }) {
  const text = remark?.trim();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  } | null>(null);

  const showTooltip = useCallback(() => {
    const el = triggerRef.current;
    if (!el || !text) return;

    const rect = el.getBoundingClientRect();
    const maxWidth = Math.min(288, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - maxWidth - 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement = spaceBelow < 100 && spaceAbove > spaceBelow ? "top" : "bottom";

    setTooltip({
      left,
      top: placement === "top" ? rect.top - 8 : rect.bottom + 8,
      placement,
    });
  }, [text]);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  if (!text) {
    return <span className="text-[#6a6a6a]">—</span>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="max-w-full"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        <p className="truncate cursor-default text-[#6a6a6a]">{text}</p>
      </div>
      {tooltip &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              left: tooltip.left,
              top: tooltip.top,
              transform: tooltip.placement === "top" ? "translateY(-100%)" : undefined,
              maxWidth: Math.min(288, window.innerWidth - 32),
            }}
            className="z-[100] w-max rounded-xl border border-[#e5e5e5] bg-[#fffaf0] px-3 py-2 text-xs leading-relaxed text-[#0a0a0a] shadow-lg whitespace-normal wrap-break-word pointer-events-none"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

export function DataPageClient({
  entries,
  total,
  page,
  totalPages,
}: DataPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DataEntry | null>(null);
  const [form, setForm] = useState<DataEntryInput>(emptyForm);
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.push(`/data?${params.toString()}`);
    },
    [router, searchParams]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (entry: DataEntry) => {
    setEditing(entry);
    setForm({
      name: entry.name,
      businessName: entry.businessName ?? "",
      location: entry.location ?? "",
      phone: entry.phone ?? "",
      instagram: entry.instagram ?? "",
      website: entry.website ?? "",
      remark: entry.remark ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = editing
        ? await updateDataEntry(editing.id, form)
        : await createDataEntry(form);

      if (result.success) {
        toast.success(editing ? "Row updated" : "Row added");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this row?")) return;
    startTransition(async () => {
      const result = await deleteDataEntry(id);
      if (result.success) {
        toast.success("Row deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleImport = (file: File) => {
    startTransition(async () => {
      const text = await file.text();
      const result = await importDataEntriesFromCsv(text);
      if (result.success && result.data) {
        toast.success(
          `Imported ${result.data.imported} row${result.data.imported === 1 ? "" : "s"}` +
            (result.data.skipped > 0 ? ` (${result.data.skipped} skipped)` : "")
        );
        router.refresh();
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportDataEntriesCsv();
      if (result.success && result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `verience-data-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const handleSendToLead = (id: string) => {
    startTransition(async () => {
      const result = await transferDataEntryToLead(id);
      if (result.success && result.data) {
        toast.success("Added to Leads");
        router.refresh();
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data"
        description={`${total} prospect row${total === 1 ? "" : "s"} · import, edit, and send to Leads`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 rounded-xl border-[#e5e5e5]"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 rounded-xl border-[#e5e5e5]"
              disabled={isPending || total === 0}
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-11 px-5 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] font-semibold"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add row
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search name, business, phone, location..."
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
        <p className="text-xs text-[#6a6a6a]">
          CSV headers: {DATA_ENTRY_CSV_HEADERS.join(", ")}
        </p>
      </div>

      <div className="clay-table-wrap">
        <Table className="w-full table-fixed min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-[#faf5e8] hover:bg-[#faf5e8]">
              <TableHead className="text-xs font-semibold w-[12%]">Name</TableHead>
              <TableHead className="text-xs font-semibold w-[12%]">Business Name</TableHead>
              <TableHead className="text-xs font-semibold w-[11%]">Location</TableHead>
              <TableHead className="text-xs font-semibold w-[11%]">Phone</TableHead>
              <TableHead className="text-xs font-semibold w-[10%]">Instagram</TableHead>
              <TableHead className="text-xs font-semibold w-[12%]">Website</TableHead>
              <TableHead className="text-xs font-semibold w-[14%]">Remark</TableHead>
              <TableHead className="text-xs font-semibold w-[18%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-[#6a6a6a]">
                  No data yet. Add rows manually or import a CSV.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="py-2.5 text-sm font-medium truncate">{entry.name}</TableCell>
                  <TableCell className="py-2.5 text-sm text-[#6a6a6a] truncate">
                    {entry.businessName || "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-[#6a6a6a] truncate">
                    {entry.location || "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-[#6a6a6a] truncate">
                    {entry.phone || "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-[#6a6a6a] truncate">
                    {entry.instagram || "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-sm truncate">
                    {entry.website ? (
                      <a
                        href={entry.website.startsWith("http") ? entry.website : `https://${entry.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0a0a0a] hover:underline"
                      >
                        {entry.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-sm overflow-visible">
                    <RemarkCell remark={entry.remark} />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-1">
                      {entry.leadClientId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-[#0a0a0a] hover:bg-[#faf5e8] shrink-0"
                          render={<Link href={`/clients/${entry.leadClientId}`} />}
                        >
                          <ArrowRightCircle className="h-4 w-4 mr-1" />
                          View lead
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-[#0a0a0a] hover:bg-[#faf5e8] shrink-0"
                          disabled={isPending}
                          onClick={() => handleSendToLead(entry.id)}
                        >
                          <ArrowRightCircle className="h-4 w-4 mr-1 shrink-0" />
                          Add to leads
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(entry)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(entry.id)}
                        title="Delete"
                        className="text-[#ef4444]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#6a6a6a]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit row" : "Add row"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="data-name">Name</Label>
              <Input
                id="data-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data-business">Business Name</Label>
              <Input
                id="data-business"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data-location">Location</Label>
              <Input
                id="data-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data-phone">Phone</Label>
              <Input
                id="data-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data-instagram">Instagram</Label>
                <Input
                  id="data-instagram"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@handle"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data-website">Website</Label>
                <Input
                  id="data-website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data-remark">Remark</Label>
              <Textarea
                id="data-remark"
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                rows={3}
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending || !form.name.trim()}
                onClick={handleSave}
                className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f]"
              >
                {isPending ? "Saving..." : editing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
