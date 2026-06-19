"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailLogs,
} from "@/app/actions/emails";
import { emailTemplateSchema, type EmailTemplateInput } from "@/lib/validations/email-template";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatRelative } from "@/lib/utils";
import { getClayCardClass } from "@/lib/clay";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Template = Awaited<ReturnType<typeof getEmailTemplates>>[number];
type EmailLog = Awaited<ReturnType<typeof getEmailLogs>>[number];

export function TemplatesPageClient({
  templates,
  logs,
}: {
  templates: Template[];
  logs: EmailLog[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EmailTemplateInput>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: { name: "", subject: "", body: "" },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", subject: "", body: "" });
    setOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    form.reset({ name: t.name, subject: t.subject, body: t.body });
    setOpen(true);
  };

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const result = editing
        ? await updateEmailTemplate(editing.id, data)
        : await createEmailTemplate(data);
      if (result.success) {
        toast.success(editing ? "Template updated" : "Template created");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  });

  const handleDelete = (id: string) => {
    if (!confirm("Delete template?")) return;
    startTransition(async () => {
      const result = await deleteEmailTemplate(id);
      if (result.success) {
        toast.success("Template deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Manage payment and follow-up reminder templates"
        action={
          <Button
            size="sm"
            onClick={openCreate}
            className="h-11 px-5 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        }
      />

      <Tabs defaultValue="templates">
        <TabsList className="h-10 bg-[#faf5e8] p-1 rounded-full mb-4">
          <TabsTrigger value="templates" className="rounded-full px-4 data-[state=active]:bg-[#f5f0e0]">Templates</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-full px-4 data-[state=active]:bg-[#f5f0e0]">Email Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-2">
          {templates.map((t, i) => (
            <div
              key={t.id}
              className={`rounded-2xl p-5 ${getClayCardClass(i)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.subject}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{t.body}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Placeholders: {"{{clientName}}"}, {"{{companyName}}"}, {"{{amount}}"}, {"{{dueDate}}"}, {"{{invoiceNumber}}"}, {"{{followUpNote}}"}
          </p>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 text-xs">To</TableHead>
                  <TableHead className="h-9 text-xs">Subject</TableHead>
                  <TableHead className="h-9 text-xs">Type</TableHead>
                  <TableHead className="h-9 text-xs">Status</TableHead>
                  <TableHead className="h-9 text-xs">Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="py-2 text-sm">{log.to}</TableCell>
                    <TableCell className="py-2 text-sm max-w-xs truncate">{log.subject}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{log.type.replace(/_/g, " ")}</TableCell>
                    <TableCell className="py-2 text-xs">{log.status}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{formatRelative(log.sentAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" {...form.register("subject")} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" {...form.register("body")} rows={6} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isPending}>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
