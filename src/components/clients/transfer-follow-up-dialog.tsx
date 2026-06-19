"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { transferClientToFollowUp } from "@/app/actions/clients";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

type TransferFollowUpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: { id: string; name: string; remark?: string | null } | null;
};

export function TransferFollowUpDialog({
  open,
  onOpenChange,
  client,
}: TransferFollowUpDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && client) {
      setNote(client.remark ?? "");
      setDate(new Date().toISOString().split("T")[0]);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    startTransition(async () => {
      const result = await transferClientToFollowUp({
        clientId: client.id,
        nextFollowUpDate: new Date(date),
        note: note || undefined,
      });

      if (result.success) {
        toast.success(`${client.name} moved to follow-up list`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Transfer to Follow-up</DialogTitle>
        </DialogHeader>
        {client && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-body-sm text-[#6a6a6a]">
              Add <strong className="text-[#0a0a0a]">{client.name}</strong> to the follow-up schedule.
            </p>
            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-up date</Label>
              <Input
                id="followUpDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpNote">Note</Label>
              <Textarea
                id="followUpNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Follow-up note..."
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f]"
              >
                {isPending ? "Transferring..." : "Add to Follow-up"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
