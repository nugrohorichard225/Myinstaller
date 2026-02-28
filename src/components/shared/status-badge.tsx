"use client";

import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; variant: BadgeVariant; dot?: string }
> = {
  PENDING: { label: "Pending", variant: "secondary", dot: "bg-gray-400" },
  QUEUED: { label: "Queued", variant: "secondary", dot: "bg-gray-400" },
  RUNNING: { label: "Running", variant: "warning", dot: "bg-amber-500" },
  VALIDATING: { label: "Validating", variant: "warning", dot: "bg-amber-500" },
  CONNECTING: { label: "Connecting", variant: "warning", dot: "bg-amber-500" },
  RENDERING: { label: "Rendering", variant: "warning", dot: "bg-amber-500" },
  PROVISIONING: { label: "Provisioning", variant: "warning", dot: "bg-blue-500" },
  REBOOTING: { label: "Rebooting", variant: "warning", dot: "bg-orange-500" },
  VERIFYING: { label: "Verifying", variant: "warning", dot: "bg-blue-500" },
  COMPLETED: { label: "Completed", variant: "success", dot: "bg-emerald-500" },
  FAILED: { label: "Failed", variant: "destructive", dot: "bg-red-500" },
  CANCELLED: { label: "Cancelled", variant: "outline", dot: "bg-gray-400" },
  DRY_RUN_COMPLETED: {
    label: "Dry Run ✓",
    variant: "success",
    dot: "bg-cyan-500",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "outline" as BadgeVariant,
    dot: "bg-gray-400",
  };

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      )}
      {config.label}
    </Badge>
  );
}
