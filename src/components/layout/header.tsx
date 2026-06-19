"use client";

import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { CommandPalette } from "./command-palette";
import { useState } from "react";

type HeaderProps = {
  user: { name: string; email: string };
};

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e5e5e5] bg-[#fffaf0] pl-5 pr-8">
        <Button
          variant="outline"
          size="sm"
          className="h-11 gap-2 w-72 justify-start rounded-xl border-[#e5e5e5] bg-[#fffaf0] text-[#6a6a6a] font-normal hover:bg-[#faf5e8]"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-auto pointer-events-none hidden h-6 select-none items-center gap-1 rounded-lg border border-[#e5e5e5] bg-[#f5f0e0] px-2 font-mono text-[11px] font-medium sm:flex">
            ⌘K
          </kbd>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-11 gap-2 px-3 rounded-xl hover:bg-[#faf5e8]"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-[#b8a4ed] text-[#0a0a0a] font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline text-[#0a0a0a]">
                  {user.name}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#e5e5e5]">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()} className="text-[#ef4444]">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
