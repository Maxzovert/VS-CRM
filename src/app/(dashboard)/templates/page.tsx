import { getEmailTemplates, getEmailLogs } from "@/app/actions/emails";
import { TemplatesPageClient } from "@/components/templates/templates-page-client";

export default async function TemplatesPage() {
  const [templates, logs] = await Promise.all([
    getEmailTemplates(),
    getEmailLogs(),
  ]);

  return <TemplatesPageClient templates={templates} logs={logs} />;
}
