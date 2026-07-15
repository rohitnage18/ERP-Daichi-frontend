"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type DaichiLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "invoice";
  showText?: boolean;
  inverted?: boolean;
};

const sizes = {
  sm: { width: 48, height: 48, text: "text-xs" },
  md: { width: 64, height: 64, text: "text-sm" },
  lg: { width: 88, height: 88, text: "text-base" },
  invoice: { width: 72, height: 72, text: "text-sm" },
};

export function DaichiLogo({ className, size = "md", showText = false, inverted }: DaichiLogoProps) {
  const dim = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/branding/daichi-logo.png"
        alt="Daichi International"
        width={dim.width}
        height={dim.height}
        className="h-auto w-auto object-contain"
        style={{ maxHeight: dim.height, maxWidth: dim.width }}
        priority
      />
      {showText && (
        <div className={cn("flex flex-col leading-tight", dim.text)}>
          <span className={cn("font-bold tracking-tight", inverted ? "text-white" : "text-slate-900")}>
            Daichi International
          </span>
          <span className={cn("text-[10px] font-medium uppercase tracking-wider", inverted ? "text-slate-300" : "text-muted-foreground")}>
            AgriFlow ERP
          </span>
        </div>
      )}
    </div>
  );
}
