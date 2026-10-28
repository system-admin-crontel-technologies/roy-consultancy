import type { Paginated, WebsiteEnquiry } from "@roy/types";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { num, qs, str, type PageWithSearch } from "@/lib/types";
import { EnquiryRows } from "@/components/admin/enquiries/enquiry-rows";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { Table, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Website enquiries" };

const SERVICES = ["Incorporation", "ROC filing", "GST", "Trademark", "Income tax", "Other"];

export default function EnquiriesPage(props: PageWithSearch) {
  return (
    <>
      <PageHeader title="Website enquiries" description="Submissions from the public contact form. New enquiries are also emailed to the organisation address set under Settings." />
      <Suspense fallback={<Card padded={false}><TableSkeleton rows={8} /></Card>}>
        <EnquiriesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function EnquiriesTable({ searchParams }: PageWithSearch) {
  const sp = await searchParams;
  const f = { q: str(sp.q) ?? "", status: str(sp.status) ?? "", service: str(sp.service) ?? "" };
  const page = num(sp.page, 1);
  const query = qs({ ...f, page, pageSize: 25 });
  const data = await apiGet<Paginated<WebsiteEnquiry>>(`/enquiries${query}`, { returnTo: `/admin/enquiries${query}` });
  return (
    <Card padded={false}>
      <form className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-4" method="get">
        <Input name="q" placeholder="Search name, phone, message" defaultValue={f.q} aria-label="Search" className="sm:col-span-2" />
        <Select name="status" defaultValue={f.status} aria-label="Status">
          <option value="">Any status</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CONVERTED">Converted</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <div className="flex gap-2">
          <Select name="service" defaultValue={f.service} aria-label="Service">
            <option value="">All services</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button type="submit" variant="secondary">Filter</Button>
        </div>
      </form>
      {data.items.length === 0 ? (
        <EmptyState title="No enquiries yet" description="Submissions from the website contact form will appear here." />
      ) : (
        <Table>
          <THead><TR><TH className="w-8" /><TH>Received</TH><TH>Name</TH><TH>Phone</TH><TH>Service</TH><TH>Status</TH></TR></THead>
          <EnquiryRows entries={data.items} />
        </Table>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => `/admin/enquiries${qs({ ...f, page: p })}`} />
    </Card>
  );
}
