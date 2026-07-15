"use client";

import { cn } from "@/lib/utils";
import { DaichiLogo } from "./DaichiLogo";

type LogoProps = {
  variant?: "full" | "mark" | "sidebar";
  className?: string;
  /** Light text on dark bg */
  inverted?: boolean;
};

export function Logo({ variant = "full", className, inverted }: LogoProps) {
  if (variant === "mark") {
    return <DaichiLogo size="sm" className={className} />;
  }

  if (variant === "sidebar") {
    return <DaichiLogo size="md" showText inverted={inverted} className={className} />;
  }

  return <DaichiLogo size="lg" showText inverted={inverted} className={className} />;
}

export function LogoImageMark({ className }: { className?: string }) {
  return <DaichiLogo size="sm" className={className} />;
}
