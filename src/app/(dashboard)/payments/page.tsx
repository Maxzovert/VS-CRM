import { getPayments } from "@/app/actions/payments";
import { getInvoices } from "@/app/actions/invoices";
import { getClientOptions } from "@/app/actions/clients";
import { PaymentsPageClient } from "@/components/payments/payments-page-client";

export default async function PaymentsPage() {
  const [payments, clients, invoices] = await Promise.all([
    getPayments(),
    getClientOptions(),
    getInvoices(),
  ]);

  return (
    <PaymentsPageClient
      payments={payments}
      clients={clients}
      invoices={invoices}
    />
  );
}
