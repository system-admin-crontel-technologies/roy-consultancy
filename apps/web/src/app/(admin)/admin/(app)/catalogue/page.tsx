import type { Paginated, ServiceCategorySummary, ServiceSummary } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { formatMinor } from "@/lib/format";
import { num, qs, str, type PageWithSearch } from "@/lib/types";
import { CreateServiceButton } from "@/components/admin/catalogue/create-service-dialog";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Service catalogue" };

export default function CataloguePage(props: PageWithSearch) {
  return (
    <>
      <PageHeader
        title="Service catalogue"
        description="Services are versioned. Orders keep the version and price in force when they were sold."
        actions={<><Link href="/admin/catalogue/categories" className="text-sm font-medium text-accent hover:underline">Categories</Link><CreateServiceButton /></>}
      />
      <Suspense fallback={<Card padded={false}><TableSkeleton /></Card>}>
        <ServicesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function ServicesTable({ searchParams }: PageWithSearch) {
  const sp = await searchParams;
  const q = str(sp.q) ?? "";
  const status = str(sp.status) ?? "";
  const categoryId = str(sp.categoryId) ?? "";
  const page = num(sp.page, 1);
  const query = qs({ q, status, categoryId, page, pageSize: 25 });
  const returnTo = `/admin/catalogue${query}`;
  const [data, categories] = await Promise.all([
    apiGet<Paginated<ServiceSummary>>(`/catalogue/services${query}`, { returnTo }),
    apiGet<ServiceCategorySummary[]>("/catalogue/categories", { returnTo }),
  ]);
  return (
    <Card padded={false}>
      <form className="flex flex-wrap items-end gap-3 border-b border-border px-5 py-4" method="get">
        <div className="w-64"><Input name="q" placeholder="Search code or name" defaultValue={q} aria-label="Search services" /></div>
        <div className="w-56">
          <Select name="categoryId" defaultValue={categoryId} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="w-40">
          <Select name="status" defaultValue={status} aria-label="Status">
            <option value="">All statuses</option>
            {["DRAFT", "ACTIVE", "PAUSED", "RETIRED"].map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
          </Select>
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {data.items.length === 0 ? (
        <EmptyState title="No services found" description="Create a service or adjust the filters." />
      ) : (
        <Table>
          <THead><TR><TH>Service</TH><TH>Category</TH><TH>Status</TH><TH>Current version</TH><TH className="text-right">Professional fee</TH><TH>Owner</TH></TR></THead>
          <TBody>
            {data.items.map((s) => (
              <TR key={s.id}>
                <TD>
                  <Link href={`/admin/catalogue/services/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                  <span className="ml-2 font-mono text-xs text-muted">{s.code}</span>
                  {s.isDemo ? <Badge className="ml-2" tone="warning">demo</Badge> : null}
                </TD>
                <TD className="text-muted">{s.category.name}</TD>
                <TD><Badge tone={statusTone(s.status)}>{s.status.toLowerCase()}</Badge></TD>
                <TD className="text-muted">{s.currentVersion ? `v${s.currentVersion.versionNumber}` : `none (${s.versionCount} draft)`}</TD>
                <TD className="text-right tabular-nums">{s.currentVersion?.price ? formatMinor(s.currentVersion.price.professionalFeeMinor, s.currentVersion.price.currency) : "—"}</TD>
                <TD className="text-muted">{s.owner?.fullName ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => `/admin/catalogue${qs({ q, status, categoryId, page: p })}`} />
    </Card>
  );
}
