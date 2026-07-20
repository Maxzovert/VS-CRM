"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getPayments, createPayment } from "@/app/actions/payments";
import { getInvoices } from "@/app/actions/invoices";
import { getClientOptions } from "@/app/actions/clients";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientNameLink } from "@/components/clients/client-name-link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type PaymentItem = Awaited<ReturnType<typeof getPayments>>[number];

export function PaymentsPageClient({
  payments,
  clients,
  invoices,
}: {
  payments: PaymentItem[];
  clients: Array<{ id: string; name: string }>;
  invoices: Awaited<ReturnType<typeof getInvoices>>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      clientId: "",
      invoiceId: null,
      paymentDate: new Date(),
      method: "Bank Transfer",
      notes: "",
    },
  });

  const selectedClientId = form.watch("clientId");
  const clientInvoices = invoices.filter((i) => i.clientId === selectedClientId);

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const result = await createPayment(data);
      if (result.success) {
        toast.success("Payment recorded");
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
        title="Payments"
        description={`${payments.length} total`}
        action={
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="h-11 px-5 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        }
      />

      <div className="clay-table-wrap">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-[#faf5e8]">
              <TableHead className="h-9 text-xs w-[24%]">Client</TableHead>
              <TableHead className="h-9 text-xs w-[18%]">Invoice</TableHead>
              <TableHead className="h-9 text-xs w-[16%]">Amount</TableHead>
              <TableHead className="h-9 text-xs w-[16%]">Date</TableHead>
              <TableHead className="h-9 text-xs w-[26%]">Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="py-2 max-w-0 truncate">
                  <ClientNameLink
                    id={p.client.id}
                    name={p.client.name}
                    className="text-sm"
                  />
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">
                  {p.invoice?.invoiceNumber ?? "—"}
                </TableCell>
                <TableCell className="py-2 text-sm font-mono tabular-nums">
                  {formatCurrency(Number(p.amount))}
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">
                  {formatDate(p.paymentDate)}
                </TableCell>
                <TableCell className="py-2 text-sm">{p.method}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select
                value={form.watch("clientId")}
                onValueChange={(v) => {
                  form.setValue("clientId", v ?? "");
                  form.setValue("invoiceId", null);
                }}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {clientInvoices.length > 0 && (
              <div className="space-y-1.5">
                <Label>Invoice (optional)</Label>
                <Select
                  value={form.watch("invoiceId") ?? "none"}
                  onValueChange={(v) => form.setValue("invoiceId", v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Link to invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No invoice</SelectItem>
                    {clientInvoices.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.invoiceNumber} — {formatCurrency(Number(i.amount))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" min="0.01" placeholder="0.00" {...form.register("amount", { valueAsNumber: true })} className="h-8" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paymentDate">Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  className="h-8"
                  onChange={(e) => form.setValue("paymentDate", new Date(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="method">Method</Label>
              <Input id="method" {...form.register("method")} className="h-8" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isPending}>Record</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
