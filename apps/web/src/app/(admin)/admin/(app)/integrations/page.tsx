import type { IntegrationSummary } from "@roy/types";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { IntegrationsTable } from "@/components/admin/integrations/integrations-table";
import { Card } from "@/components/ui/card";
import { PageHeader, TableSkeleton } from "@/components/ui/feedback";

export const metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader title="Integrations" description="Provider registry and health. Secrets live in the environment or secret store and are referenced by name only." />
      <Suspense fallback={<Card padded={false}><TableSkeleton /></Card>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const integrations = await apiGet<IntegrationSummary[]>("/integrations", { returnTo: "/admin/integrations" });
  return <IntegrationsTable integrations={integrations} />;
}
