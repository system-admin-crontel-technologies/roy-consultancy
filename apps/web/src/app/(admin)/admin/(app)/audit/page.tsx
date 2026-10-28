import type { AuditLogEntry, Paginated } from "@roy/types";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { num, qs, str, type PageWithSearch } from "@/lib/types";
import { AuditRows } from "@/components/admin/audit/audit-rows";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { Table, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Audit log" };

export default function AuditPage(props: PageWithSearch) {
  return (
    <>
      <PageHeader title="Audit log" description="Append-only record of privileged and material actions. Entries cannot be edited or deleted." />
      <Suspense fallback={<Card padded={false}><TableSkeleton rows={10} /></Card>}>
        <AuditTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function AuditTable({ searchParams }: PageWithSearch) {
  const sp = await searchParams;
  const f = { q: str(sp.q) ?? "", action: str(sp.action) ?? "", resourceType: str(sp.resourceType) ?? "", outcome: str(sp.outcome) ?? "", from: str(sp.from) ?? "", to: str(sp.to) ?? "" };
  const page = num(sp.page, 1);
  const query = qs({ ...f, page, pageSize: 50 });
  const returnTo = `/admin/audit${query}`;
  const [data, facets] = await Promise.all([
    apiGet<Paginated<AuditLogEntry>>(`/audit-logs${query}`, { returnTo }),
    apiGet<{ actions: string[]; resourceTypes: string[] }>("/audit-logs/actions", { returnTo }),
  ]);
  return (
    <Card padded={false}>
      <form className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-3 lg:grid-cols-7" method="get">
        <Input name="q" placeholder="Search actor, action, id" defaultValue={f.q} aria-label="Search" className="lg:col-span-2" />
        <Select name="action" defaultValue={f.action} aria-label="Action"><option value="">All actions</option>{facets.actions.map((a) => <option key={a} value={a}>{a}</option>)}</Select>
        <Select name="resourceType" defaultValue={f.resourceType} aria-label="Resource"><option value="">All resources</option>{facets.resourceTypes.map((r) => <option key={r} value={r}>{r}</option>)}</Select>
        <Select name="outcome" defaultValue={f.outcome} aria-label="Outcome"><option value="">Any outcome</option><option>SUCCESS</option><option>FAILURE</option><option>DENIED</option></Select>
        <Input name="from" type="date" defaultValue={f.from} aria-label="From date" />
        <div className="flex gap-2"><Input name="to" type="date" defaultValue={f.to} aria-label="To date" /><Button type="submit" variant="secondary">Filter</Button></div>
      </form>
      {data.items.length === 0 ? (
        <EmptyState title="No audit events match" />
      ) : (
        <Table>
          <THead><TR><TH className="w-8" /><TH>When</TH><TH>Actor</TH><TH>Action</TH><TH>Resource</TH><TH>Outcome</TH><TH>IP</TH></TR></THead>
          <AuditRows entries={data.items} />
        </Table>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => `/admin/audit${qs({ ...f, page: p })}`} />
    </Card>
  );
}
