import type { ServiceCategorySummary, ServiceSummary, ServiceVersionSummary } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import type { PageWithId } from "@/lib/types";
import { ServiceDetail } from "@/components/admin/catalogue/service-detail";
import { Skeleton } from "@/components/ui/feedback";

export const metadata = { title: "Service" };

export default function ServicePage(props: PageWithId) {
  return (
    <>
      <Link href="/admin/catalogue" className="text-xs text-muted hover:text-foreground">← Service catalogue</Link>
      <Suspense fallback={<div className="mt-4 space-y-4"><Skeleton className="h-10 w-80" /><Skeleton className="h-96" /></div>}>
        <Content params={props.params} />
      </Suspense>
    </>
  );
}

async function Content({ params }: PageWithId) {
  const { id } = await params;
  const returnTo = `/admin/catalogue/services/${id}`;
  const [service, categories] = await Promise.all([
    apiGet<ServiceSummary & { versions: ServiceVersionSummary[] }>(`/catalogue/services/${id}`, { returnTo }),
    apiGet<ServiceCategorySummary[]>("/catalogue/categories", { returnTo }),
  ]);
  return <ServiceDetail service={service} categories={categories} />;
}
