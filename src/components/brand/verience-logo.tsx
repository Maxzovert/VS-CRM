import Image from "next/image";
import { cn } from "@/lib/utils";

type VerienceLogoProps = {
  size?: number;
  className?: string;
};

/**
 * Brand mark — solid stylized V + blue accent.
 */
export function VerienceLogo({ size = 32, className }: VerienceLogoProps) {
  return (
    <Image
      src="/brand/verience-logo.png"
      alt="Verience"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg object-contain", className)}
      priority
    />
  );
}
