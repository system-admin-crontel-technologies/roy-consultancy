"use client";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-4">
      <Alert tone="danger" title="Something went wrong">
        {error.message || "An unexpected error occurred."}
        {error.digest ? <span className="block text-xs opacity-70">Reference: {error.digest}</span> : null}
      </Alert>
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
