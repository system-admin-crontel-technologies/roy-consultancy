import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "ACTIVE":
    case "SUCCESS":
      return "success";
    case "INVITED":
    case "DRAFT":
    case "NOT_CONFIGURED":
      return "info";
    case "SUSPENDED":
    case "PAUSED":
    case "DENIED":
      return "warning";
    case "DISABLED":
    case "RETIRED":
    case "ERROR":
    case "FAILURE":
      return "danger";
    default:
      return "neutral";
  }
}
