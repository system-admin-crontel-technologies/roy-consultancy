import type { GstCredential, Paginated } from "@roy/types";
import { Search } from "lucide-react";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { num, qs, str, type PageWithSearch } from "@/lib/types";
import { AddCredentialButton } from "@/components/admin/gst-credentials/credential-form-dialog";
import { CredentialTable } from "@/components/admin/gst-credentials/credential-rows";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";

export const metadata = { title: "GST credentials" };

export default function GstCredentialsPage(props: PageWithSearch) {
  return (
    <>
      <PageHeader
        title="GST credentials"
        description="Clients' logins for the official GST portal. Passwords are stored encrypted; every copy or view of a password is recorded in the audit log."
        actions={<AddCredentialButton />}
      />
      <Suspense fallback={<Card padded={false}><TableSkeleton rows={8} /></Card>}>
        <CredentialsTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function CredentialsTable({ searchParams }: PageWithSearch) {
  const sp = await searchParams;
  const q = str(sp.q) ?? "";
  const page = num(sp.page, 1);
  const query = qs({ q, page, pageSize: 50 });
  const data = await apiGet<Paginated<GstCredential>>(`/gst-credentials${query}`, { returnTo: `/admin/gst-credentials${qs({ q, page })}` });
  return (
    <Card padded={false}>
      <form className="flex gap-2 border-b border-border px-4 py-4 md:px-5" method="get" role="search">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input name="q" type="search" placeholder="Search by client name" defaultValue={q} aria-label="Search by client name" className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      {data.items.length === 0 ? (
        q ? (
          <EmptyState title="No matching clients" description={`No client name contains “${q}”.`} />
        ) : (
          <EmptyState title="No GST logins yet" description="Use “Add client” to store a client's GST portal user ID and password." />
        )
      ) : (
        <CredentialTable entries={data.items} />
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => `/admin/gst-credentials${qs({ q, page: p })}`} />
    </Card>
  );
}
