"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { getEmailPreview, sendEmailWithTemplate } from "@/app/actions/emails";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type EmailTemplateOption = {
  id: string;
  name: string;
};

type SendEmailMenuProps = {
  clientId: string;
  followUpId?: string;
  invoiceId?: string;
  disabled?: boolean;
  templates: EmailTemplateOption[];
  buttonClassName?: string;
};

export function SendEmailMenu({
  clientId,
  followUpId,
  invoiceId,
  disabled,
  templates,
  buttonClassName,
}: SendEmailMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    to: string;
    subject: string;
    body: string;
    clientName: string;
    templateName: string;
  } | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    startTransition(async () => {
      const result = await getEmailPreview({
        templateId,
        clientId,
        followUpId,
        invoiceId,
      });

      if (result.success && result.data) {
        setSelectedTemplateId(templateId);
        setPreview(result.data);
        setDialogOpen(true);
      } else if (!result.success) {
        toast.error(result.error ?? "Could not load email preview");
      }
    });
  };

  const handleSend = () => {
    if (!selectedTemplateId || !preview) return;

    startTransition(async () => {
      const result = await sendEmailWithTemplate({
        templateId: selectedTemplateId,
        clientId,
        followUpId,
        invoiceId,
        subject: preview.subject,
        body: preview.body,
      });

      if (result.success) {
        toast.success(`Email sent to ${preview.clientName}`);
        setDialogOpen(false);
        setPreview(null);
        setSelectedTemplateId(null);
        router.refresh();
      } else if (!result.success) {
        toast.error(result.error ?? "Failed to send email");
      }
    });
  };

  if (templates.length === 0) {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={disabled || isPending}
        title="No templates — create one in Templates"
        className={buttonClassName}
        onClick={() => toast.error("Create an email template first")}
      >
        <Mail className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={disabled || isPending}
              title="Send email"
              className={buttonClassName}
            >
              <Mail className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56 rounded-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Select template</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                disabled={isPending}
              >
                {template.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send email</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <p className="text-sm text-[#6a6a6a]">
                Template: <span className="text-[#0a0a0a] font-medium">{preview.templateName}</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email-to">To</Label>
                <Input id="email-to" value={preview.to} readOnly className="h-11 rounded-xl bg-[#faf5e8]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={preview.subject}
                  onChange={(e) => setPreview({ ...preview, subject: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-body">Message</Label>
                <Textarea
                  id="email-body"
                  value={preview.body}
                  onChange={(e) => setPreview({ ...preview, body: e.target.value })}
                  rows={8}
                  className="rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={isPending}
                  className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f]"
                >
                  {isPending ? "Sending..." : "Send email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
