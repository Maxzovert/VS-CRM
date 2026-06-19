"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/utils";

const initialState: ActionResult = { success: true };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-[#0a0a0a]">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 rounded-xl border-[#e5e5e5] bg-[#fffaf0] text-[#0a0a0a] focus-visible:ring-[#0a0a0a]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-[#0a0a0a]">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          className="h-11 rounded-xl border-[#e5e5e5] bg-[#fffaf0] text-[#0a0a0a] focus-visible:ring-[#0a0a0a]"
        />
      </div>
      {!state.success && (
        <p className="text-sm text-[#ef4444]">{state.error}</p>
      )}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-[#0a0a0a] text-white hover:bg-[#1f1f1f] font-semibold"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
