"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AllowanceRemovedPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/field");
  }, [router]);
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Allowance claims have been removed from the Sales module.
    </div>
  );
}
