import type { AdminOverview } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { formatDateTime, relativeTime } from "@/lib/format";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, Stat } from "@/components/ui/card";
import { PageHeader, Skeleton } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Platform health, access and configuration at a glance." />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}

async function OverviewContent() {
  const o = await apiGet<AdminOverview>("/admin/overview", { returnTo: "/admin" });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={o.users.total} hint={`${o.users.active} active · ${o.users.invited} invited · ${o.users.suspended + o.users.disabled} inactive`} />
        <Stat label="Roles" value={o.roles} hint="System and custom roles" />
        <Stat label="Services" value={o.services.total} hint={`${o.services.active} active · ${o.services.draft} draft · ${o.categories} categories`} />
        <Stat label="Integrations" value={`${o.integrations.active}/${o.integrations.total}`} hint={o.integrations.error ? `${o.integrations.error} reporting errors` : "healthy or not configured"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Recent audit events" className="lg:col-span-3" padded={false} actions={<Link href="/admin/audit" className="text-xs font-medium text-accent hover:underline">View all</Link>}>
          <Table>
            <THead>
              <TR><TH>When</TH><TH>Actor</TH><TH>Action</TH><TH>Outcome</TH></TR>
            </THead>
            <TBody>
              {o.recentAudit.length === 0 ? (
                <TR><TD colSpan={4} className="text-center text-muted">No audit events yet.</TD></TR>
              ) : (
                o.recentAudit.map((a) => (
                  <TR key={a.id}>
                    <TD className="whitespace-nowrap text-muted" title={formatDateTime(a.occurredAt)}>{relativeTime(a.occurredAt)}</TD>
                    <TD className="max-w-48 truncate">{a.actorLabel ?? a.actorType}</TD>
                    <TD className="font-mono text-xs">{a.action}</TD>
                    <TD><Badge tone={statusTone(a.outcome)}>{a.outcome}</Badge></TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
        <Card title="Recent sign-in activity" className="lg:col-span-2" padded={false}>
          <Table>
            <THead>
              <TR><TH>When</TH><TH>Event</TH><TH>Email</TH></TR>
            </THead>
            <TBody>
              {o.recentAuthEvents.length === 0 ? (
                <TR><TD colSpan={3} className="text-center text-muted">No sign-in activity yet.</TD></TR>
              ) : (
                o.recentAuthEvents.map((e) => (
                  <TR key={e.id}>
                    <TD className="whitespace-nowrap text-muted" title={formatDateTime(e.occurredAt)}>{relativeTime(e.occurredAt)}</TD>
                    <TD><Badge tone={e.type.includes("FAILED") || e.type.includes("LOCKED") || e.type.includes("REUSE") ? "danger" : "neutral"}>{e.type.replace(/_/g, " ").toLowerCase()}</Badge></TD>
                    <TD className="max-w-40 truncate text-xs">{e.email ?? "—"}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 lg:col-span-3" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
    </div>
  );
}
