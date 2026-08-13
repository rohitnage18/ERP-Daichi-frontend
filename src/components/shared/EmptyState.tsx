import type { ReactNode } from "react";
import { Package } from "lucide-react";

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-8">
      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
