import { getInvoices } from "@/app/actions/invoices";
import { getClientOptions } from "@/app/actions/clients";
import { getEmailTemplates } from "@/app/actions/emails";
import { InvoicesPageClient } from "@/components/invoices/invoices-page-client";

export default async function InvoicesPage() {
  const [invoices, clients, templates] = await Promise.all([
    getInvoices(),
    getClientOptions(),
    getEmailTemplates(),
  ]);

  return (
    <InvoicesPageClient
      invoices={invoices}
      clients={clients}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
