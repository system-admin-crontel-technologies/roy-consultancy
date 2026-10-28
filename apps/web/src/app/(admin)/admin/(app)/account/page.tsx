import type { AuthUser, SessionSummary } from "@roy/types";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { AccountPanel } from "@/components/admin/account/account-panel";
import { PageHeader, Skeleton } from "@/components/ui/feedback";

export const metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <>
      <PageHeader title="My account" description="Your profile, password and active sessions." />
      <Suspense fallback={<div className="space-y-6"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const [me, sessions] = await Promise.all([
    apiGet<AuthUser>("/auth/me", { returnTo: "/admin/account" }),
    apiGet<SessionSummary[]>("/auth/sessions", { returnTo: "/admin/account" }),
  ]);
  return <AccountPanel me={me} sessions={sessions} />;
}
