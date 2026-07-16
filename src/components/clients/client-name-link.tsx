"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

type ClientNameLinkProps = {
  id: string;
  name: string;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/** Navigate to client/lead detail page from any surface. */
export function ClientNameLink({
  id,
  name,
  className,
  onClick,
}: ClientNameLinkProps) {
  return (
    <Link
      href={`/clients/${id}`}
      onClick={onClick}
      className={cn(
        "font-medium text-[#0a0a0a] hover:underline underline-offset-2",
        className
      )}
    >
      {name}
    </Link>
  );
}
