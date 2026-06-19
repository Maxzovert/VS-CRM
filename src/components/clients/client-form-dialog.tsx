"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientStatus } from "@prisma/client";
import { createClient, updateClient } from "@/app/actions/clients";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
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

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<ClientInput> & { id?: string };
  variant?: "leads" | "clients";
};

export function ClientFormDialog({
  open,
  onOpenChange,
  defaultValues,
  variant = "leads",
}: ClientFormDialogProps) {
  const isLeads = variant === "leads";
  const label = isLeads ? "Lead" : "Client";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!defaultValues?.id;

  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      companyName: defaultValues?.companyName ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      country: defaultValues?.country ?? "",
      state: defaultValues?.state ?? "",
      city: defaultValues?.city ?? "",
      website: defaultValues?.website ?? "",
      remark: defaultValues?.remark ?? "",
      status: defaultValues?.status ?? (isLeads ? ClientStatus.LEAD : ClientStatus.ACTIVE),
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateClient(defaultValues!.id!, data)
        : await createClient(data);

      if (result.success) {
        toast.success(isEdit ? `${label} updated` : `${label} added`);
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
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${label}` : `Add ${label}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="name">Contact name</Label>
              <Input id="name" {...form.register("name")} className="h-11 rounded-xl" />
              {form.formState.errors.name && (
                <p className="text-xs text-[#ef4444]">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" {...form.register("companyName")} className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} placeholder="+91..." className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...form.register("country")} placeholder="India" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...form.register("state")} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("city")} className="h-11 rounded-xl" />
            </div>
          </div>
          {isLeads && (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as ClientStatus)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[ClientStatus.LEAD, ClientStatus.LOST].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remark">Remark</Label>
                <Textarea id="remark" {...form.register("remark")} rows={3} className="rounded-xl" />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f]"
            >
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
