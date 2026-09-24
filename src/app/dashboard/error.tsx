"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h2 className="text-xl font-semibold">This page could not be shown</h2>
      <p className="text-sm text-muted-foreground">The rest of the app is still available. Try opening the page again.</p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
