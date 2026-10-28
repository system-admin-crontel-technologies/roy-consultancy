import type { Paginated, UserSummary } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { formatDateTime } from "@/lib/format";
import { num, qs, str, type PageWithSearch } from "@/lib/types";
import { InviteUserButton } from "@/components/admin/users/invite-user-dialog";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Users" };

export default function UsersPage(props: PageWithSearch) {
  return (
    <>
      <PageHeader title="Users" description="Invite staff, assign roles and control access." actions={<InviteUserButton />} />
      <Suspense fallback={<Card padded={false}><TableSkeleton /></Card>}>
        <UsersTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function UsersTable({ searchParams }: PageWithSearch) {
  const sp = await searchParams;
  const q = str(sp.q) ?? "";
  const status = str(sp.status) ?? "";
  const page = num(sp.page, 1);
  const query = qs({ q, status, page, pageSize: 25 });
  const data = await apiGet<Paginated<UserSummary>>(`/users${query}`, { returnTo: `/admin/users${query}` });

  return (
    <Card padded={false}>
      <form className="flex flex-wrap items-end gap-3 border-b border-border px-5 py-4" method="get">
        <div className="w-64">
          <Input name="q" placeholder="Search name or email" defaultValue={q} aria-label="Search users" />
        </div>
        <div className="w-44">
          <Select name="status" defaultValue={status} aria-label="Filter by status">
            <option value="">All statuses</option>
            {["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"].map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
          </Select>
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {data.items.length === 0 ? (
        <EmptyState title="No users match" description="Adjust the filters or invite a new user." />
      ) : (
        <Table>
          <THead>
            <TR><TH>Name</TH><TH>Email</TH><TH>Roles</TH><TH>Department</TH><TH>Status</TH><TH>Last login</TH></TR>
          </THead>
          <TBody>
            {data.items.map((u) => (
              <TR key={u.id}>
                <TD>
                  <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">{u.fullName}</Link>
                  {u.isDemo ? <Badge className="ml-2" tone="warning">demo</Badge> : null}
                </TD>
                <TD className="text-muted">{u.email}</TD>
                <TD className="space-x-1">{u.roles.map((r) => <Badge key={r.code}>{r.name}</Badge>)}</TD>
                <TD className="text-muted">{u.department?.name ?? "—"}</TD>
                <TD><Badge tone={statusTone(u.status)}>{u.status.toLowerCase()}</Badge></TD>
                <TD className="whitespace-nowrap text-muted">{formatDateTime(u.lastLoginAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => `/admin/users${qs({ q, status, page: p })}`} />
    </Card>
  );
}
