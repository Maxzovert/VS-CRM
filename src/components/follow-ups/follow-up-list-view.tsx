"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { FollowUpStatus } from "@prisma/client";
import { updateFollowUpStatus } from "@/app/actions/follow-ups";
import { SendEmailMenu } from "@/components/emails/send-email-menu";
import { ClientNameLink } from "@/components/clients/client-name-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

type FollowUpItem = {
  id: string;
  note: string;
  nextFollowUpDate: Date;
  status: FollowUpStatus;
  client: {
    id: string;
    name: string;
    companyName: string | null;
    email: string | null;
    phone: string | null;
  };
};

export function FollowUpListView({
  followUps,
  templates,
}: {
  followUps: FollowUpItem[];
  templates: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (id: string, status: FollowUpStatus) => {
    startTransition(async () => {
      const result = await updateFollowUpStatus(id, status);
      if (result.success) {
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="clay-table-wrap">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[18%] h-10 text-xs font-semibold">Client</TableHead>
            <TableHead className="w-[32%] h-10 text-xs font-semibold">Note</TableHead>
            <TableHead className="w-[18%] h-10 text-xs font-semibold">Date</TableHead>
            <TableHead className="w-[16%] h-10 text-xs font-semibold">Status</TableHead>
            <TableHead className="w-[72px] h-10 text-xs font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followUps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-sm text-[#6a6a6a]">
                No follow-ups found
              </TableCell>
            </TableRow>
          ) : (
            followUps.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="py-2 max-w-0">
                  <ClientNameLink
                    id={f.client.id}
                    name={f.client.name}
                    className="text-sm truncate block"
                  />
                  {f.client.companyName && (
                    <p className="text-xs text-[#6a6a6a] truncate">{f.client.companyName}</p>
                  )}
                </TableCell>
                <TableCell className="py-2 text-sm max-w-0 truncate">{f.note}</TableCell>
                <TableCell className="py-2 text-sm text-[#6a6a6a] truncate max-w-0">
                  {formatDate(f.nextFollowUpDate)}
                </TableCell>
                <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={f.status}
                    onValueChange={(v) => handleStatusChange(f.id, v as FollowUpStatus)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-8 w-full max-w-[132px] rounded-lg border-[#e5e5e5] bg-[#fffaf0] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(FollowUpStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex gap-1">
                    <SendEmailMenu
                      clientId={f.client.id}
                      followUpId={f.id}
                      disabled={!f.client.email}
                      templates={templates}
                      buttonClassName="rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={!f.client.phone}
                      onClick={() => openWhatsApp(f.client.phone)}
                      title="WhatsApp"
                      className="rounded-lg text-[#25D366]"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
