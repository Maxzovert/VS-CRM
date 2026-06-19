"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  CalendarDays,
  FileText,
  CreditCard,
  Mail,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/follow-ups", label: "Follow-ups", icon: MessageSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/templates", label: "Templates", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-[#e5e5e5] bg-[#fffaf0]">
      <div className="flex h-16 items-center px-6 border-b border-[#e5e5e5]">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff4d8b] text-sm font-semibold text-white">
            V
          </span>
          <span className="text-sm font-semibold tracking-tight text-[#0a0a0a]">
            Verience
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#f5f0e0] text-[#0a0a0a]"
                  : "text-[#6a6a6a] hover:bg-[#faf5e8] hover:text-[#0a0a0a]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#e5e5e5] p-4">
        <div className="rounded-2xl bg-[#faf5e8] p-4">
          <p className="text-caption-uppercase text-[#6a6a6a] mb-1">Your CRM</p>
          <p className="text-body-sm text-[#3a3a3a]">
            Manage clients, follow-ups & payments in one warm workspace.
          </p>
        </div>
      </div>
    </aside>
  );
}
