import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "pending" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "info" },
  UNDER_REVIEW: { label: "Under Review", variant: "pending" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "pending" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "info" },
  DISPATCHED: { label: "Dispatched", variant: "info" },
  IN_TRANSIT: { label: "In Transit", variant: "warning" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "warning" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  PENDING: { label: "Pending", variant: "pending" },
  ALLOCATED: { label: "Allocated", variant: "info" },
  PACKED: { label: "Packed", variant: "info" },
  FAILED_DELIVERY: { label: "Failed Delivery", variant: "destructive" },
  GENERATED: { label: "Generated", variant: "info" },
  SENT: { label: "Sent", variant: "info" },
  PARTIALLY_PAID: { label: "Partially Paid", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
