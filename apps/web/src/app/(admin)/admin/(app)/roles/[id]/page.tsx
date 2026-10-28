import type { RoleSummary } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import type { PageWithId } from "@/lib/types";
import { RoleEditor } from "@/components/admin/roles/role-editor";
import { Skeleton } from "@/components/ui/feedback";

export const metadata = { title: "Role" };

export default function RolePage(props: PageWithId) {
  return (
    <>
      <Link href="/admin/roles" className="text-xs text-muted hover:text-foreground">← All roles</Link>
      <Suspense fallback={<div className="mt-4 space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-96" /></div>}>
        <RoleContent params={props.params} />
      </Suspense>
    </>
  );
}

async function RoleContent({ params }: PageWithId) {
  const { id } = await params;
  const returnTo = `/admin/roles/${id}`;
  const [role, permissions] = await Promise.all([
    apiGet<RoleSummary>(`/roles/${id}`, { returnTo }),
    apiGet<{ code: string; module: string; description: string }[]>("/permissions", { returnTo }),
  ]);
  return <RoleEditor role={role} permissions={permissions} />;
}
