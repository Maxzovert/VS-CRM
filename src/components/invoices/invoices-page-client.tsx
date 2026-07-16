"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getInvoices } from "@/app/actions/invoices";
import { createInvoice } from "@/app/actions/invoices";
import { getClientOptions } from "@/app/actions/clients";
import { SendEmailMenu } from "@/components/emails/send-email-menu";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/invoice";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";
import { ClientNameLink } from "@/components/clients/client-name-link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type InvoiceItem = Awaited<ReturnType<typeof getInvoices>>[number];

export function InvoicesPageClient({
  invoices,
  clients,
  templates,
}: {
  invoices: InvoiceItem[];
  clients: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: "",
      invoiceNumber: "",
      dueDate: new Date(),
      status: InvoiceStatus.PENDING,
    },
  });

  const selectedClientId = form.watch("clientId");
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const result = await createInvoice(data);
      if (result.success) {
        toast.success("Invoice created");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={`${invoices.length} total`}
        action={
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="h-11 px-5 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        }
      />

      <div className="clay-table-wrap">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-[#faf5e8]">
              <TableHead className="h-9 text-xs w-[14%]">Invoice</TableHead>
              <TableHead className="h-9 text-xs w-[22%]">Client</TableHead>
              <TableHead className="h-9 text-xs w-[14%]">Amount</TableHead>
              <TableHead className="h-9 text-xs w-[14%]">Due Date</TableHead>
              <TableHead className="h-9 text-xs w-[12%]">Status</TableHead>
              <TableHead className="h-9 text-xs w-[72px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="py-2 text-sm font-medium truncate max-w-0">{inv.invoiceNumber}</TableCell>
                <TableCell className="py-2 max-w-0 truncate">
                  <ClientNameLink
                    id={inv.client.id}
                    name={inv.client.name}
                    className="text-sm"
                  />
                </TableCell>
                <TableCell className="py-2 text-sm font-mono tabular-nums">
                  {formatCurrency(Number(inv.amount))}
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">
                  {formatDate(inv.dueDate)}
                </TableCell>
                <TableCell className="py-2">
                  <StatusBadge status={inv.status} />
                </TableCell>
                <TableCell className="py-2">
                  {inv.status !== InvoiceStatus.PAID && inv.client.email && (
                    <SendEmailMenu
                      clientId={inv.client.id}
                      invoiceId={inv.id}
                      templates={templates}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select
                value={selectedClientId || undefined}
                onValueChange={(v) => form.setValue("clientId", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  {selectedClient ? (
                    <span className="truncate">{selectedClient.name}</span>
                  ) : (
                    <SelectValue placeholder="Select client" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-xs text-[#ef4444]">{form.formState.errors.clientId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input id="invoiceNumber" {...form.register("invoiceNumber")} className="h-11 rounded-xl" />
              {form.formState.errors.invoiceNumber && (
                <p className="text-xs text-[#ef4444]">{form.formState.errors.invoiceNumber.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="h-11 rounded-xl"
                  {...form.register("amount", { valueAsNumber: true })}
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-[#ef4444]">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="h-11 rounded-xl"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    form.setValue("dueDate", new Date(e.target.value), { shouldValidate: true })
                  }
                />
                {form.formState.errors.dueDate && (
                  <p className="text-xs text-[#ef4444]">{form.formState.errors.dueDate.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" size="sm" disabled={isPending} className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f]">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
