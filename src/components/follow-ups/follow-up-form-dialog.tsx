"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FollowUpStatus } from "@prisma/client";
import { createFollowUp } from "@/app/actions/follow-ups";
import { followUpSchema, type FollowUpInput } from "@/lib/validations/follow-up";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type FollowUpFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string; companyName?: string | null }>;
};

export function FollowUpFormDialog({
  open,
  onOpenChange,
  clients,
}: FollowUpFormDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      clientId: "",
      note: "",
      nextFollowUpDate: new Date(),
      status: FollowUpStatus.PENDING,
    },
  });

  const clientId = form.watch("clientId");
  const selectedClient = clients.find((c) => c.id === clientId);

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const result = await createFollowUp(data);

      if (result.success) {
        toast.success("Follow-up created");
        onOpenChange(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>New Follow-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select
              value={clientId || undefined}
              onValueChange={(v) => form.setValue("clientId", v ?? "")}
            >
              <SelectTrigger className="h-11 w-full rounded-xl">
                {selectedClient ? (
                  <span className="flex-1 truncate text-left">
                    {selectedClient.name}
                    {selectedClient.companyName ? (
                      <span className="text-[#6a6a6a]"> · {selectedClient.companyName}</span>
                    ) : null}
                  </span>
                ) : (
                  <SelectValue placeholder="Select client" />
                )}
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.companyName ? ` · ${c.companyName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" {...form.register("note")} rows={3} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nextFollowUpDate">Next follow-up date</Label>
            <Input
              id="nextFollowUpDate"
              type="date"
              className="h-11 rounded-xl"
              defaultValue={new Date().toISOString().split("T")[0]}
              onChange={(e) => form.setValue("nextFollowUpDate", new Date(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as FollowUpStatus)}
            >
              <SelectTrigger className="h-11 w-full rounded-xl">
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
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f]"
            >
              {isPending ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
