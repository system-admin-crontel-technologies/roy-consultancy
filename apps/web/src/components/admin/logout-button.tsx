"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      aria-label="Sign out"
      onClick={async () => {
        setPending(true);
        try {
          await api("/auth/logout", { method: "POST", body: {} });
        } catch {
          // Leave anyway: the cookies are cleared or the session is already gone.
        } finally {
          // Full page load on purpose. A client-side navigation lets Next.js restore the login
          // form's earlier state (spinner still on, credentials still typed) and keeps previously
          // viewed admin pages, including client credentials, in the browser's router cache.
          window.location.replace("/admin/login");
        }
      }}
    >
      {pending ? null : <LogOut className="size-4" aria-hidden />}
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
