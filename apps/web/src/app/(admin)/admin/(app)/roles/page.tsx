import type { RoleSummary } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { CreateRoleButton } from "@/components/admin/roles/create-role-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader, TableSkeleton } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Roles" };

export default function RolesPage() {
  return (
    <>
      <PageHeader title="Roles & permissions" description="Roles are starting templates; every endpoint still checks the specific permission." actions={<CreateRoleButton />} />
      <Suspense fallback={<Card padded={false}><TableSkeleton /></Card>}>
        <RolesTable />
      </Suspense>
    </>
  );
}

async function RolesTable() {
  const roles = await apiGet<RoleSummary[]>("/roles", { returnTo: "/admin/roles" });
  return (
    <Card padded={false}>
      <Table>
        <THead><TR><TH>Role</TH><TH>Code</TH><TH>Permissions</TH><TH>Users</TH><TH>Type</TH></TR></THead>
        <TBody>
          {roles.map((r) => (
            <TR key={r.id}>
              <TD>
                <Link href={`/admin/roles/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
                {r.description ? <p className="max-w-md text-xs text-muted">{r.description}</p> : null}
              </TD>
              <TD className="font-mono text-xs">{r.code}</TD>
              <TD className="tabular-nums">{r.code === "SUPER_ADMIN" ? "all" : r.permissions.length}</TD>
              <TD className="tabular-nums">{r.userCount}</TD>
              <TD>{r.isSystem ? <Badge tone="info">system</Badge> : <Badge>custom</Badge>}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
