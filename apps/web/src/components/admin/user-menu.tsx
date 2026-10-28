import type { AuthUser } from "@roy/types";
import { apiGet } from "@/lib/api/server";
import { LogoutButton } from "./logout-button";

export async function UserMenu() {
  const user = await apiGet<AuthUser>("/auth/me", { returnTo: "/admin" });
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium leading-tight">{user.fullName}</p>
        <p className="text-xs text-muted">{user.roles.map((r) => r.replace(/_/g, " ").toLowerCase()).join(", ")}</p>
      </div>
      <LogoutButton />
    </div>
  );
}
