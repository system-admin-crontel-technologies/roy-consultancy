import type { RoleSummary, SessionSummary, UserSummary } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import type { PageWithId } from "@/lib/types";
import { UserDetail } from "@/components/admin/users/user-detail";
import { Skeleton } from "@/components/ui/feedback";

export const metadata = { title: "User" };

export default function UserPage(props: PageWithId) {
  return (
    <>
      <Link href="/admin/users" className="text-xs text-muted hover:text-foreground">← All users</Link>
      <Suspense fallback={<div className="mt-4 space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-64" /></div>}>
        <UserContent params={props.params} />
      </Suspense>
    </>
  );
}

async function UserContent({ params }: PageWithId) {
  const { id } = await params;
  const returnTo = `/admin/users/${id}`;
  const [user, roles, departments, sessions] = await Promise.all([
    apiGet<UserSummary>(`/users/${id}`, { returnTo }),
    apiGet<RoleSummary[]>("/roles", { returnTo }),
    apiGet<{ id: string; code: string; name: string; isActive: boolean }[]>("/departments", { returnTo }),
    apiGet<SessionSummary[]>(`/users/${id}/sessions`, { returnTo }),
  ]);
  return <UserDetail user={user} roles={roles} departments={departments} sessions={sessions} />;
}
