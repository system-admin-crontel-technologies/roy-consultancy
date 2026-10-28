import type { NumberingSequenceSummary, OrganisationSettings } from "@roy/types";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { OrganisationForm } from "@/components/admin/settings/organisation-form";
import { SequencesTable } from "@/components/admin/settings/sequences-table";
import { PageHeader, Skeleton } from "@/components/ui/feedback";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Organisation profile, localisation and reference numbering." />
      <Suspense fallback={<div className="space-y-6"><Skeleton className="h-96" /><Skeleton className="h-64" /></div>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const [org, sequences, timezones] = await Promise.all([
    apiGet<OrganisationSettings>("/settings/organisation", { returnTo: "/admin/settings" }),
    apiGet<NumberingSequenceSummary[]>("/settings/sequences", { returnTo: "/admin/settings" }),
    apiGet<string[]>("/settings/timezones", { returnTo: "/admin/settings" }),
  ]);
  return (
    <div className="space-y-6">
      <OrganisationForm initial={org} timezones={timezones} />
      <SequencesTable sequences={sequences} />
    </div>
  );
}
