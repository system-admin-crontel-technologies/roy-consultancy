"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
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
        } finally {
          router.replace("/admin/login");
          router.refresh();
        }
      }}
    >
      <LogOut className="size-4" aria-hidden />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
