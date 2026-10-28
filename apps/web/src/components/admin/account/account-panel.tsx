"use client";

import type { AuthUser, SessionSummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { PasswordRules } from "@/components/admin/password-rules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

export function AccountPanel({ me, sessions }: { me: AuthUser; sessions: SessionSummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setPending(key);
    setError(null);
    try {
      await fn();
      toast("success", success);
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
    } finally {
      setPending(null);
    }
  }

  function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm) return setError(["New passwords do not match."]);
    void run("pw", () => api("/auth/change-password", { body: { currentPassword: pw.current, newPassword: pw.next } }), "Password changed. Other sessions were signed out.").then(() => setPw({ current: "", next: "", confirm: "" }));
  }

  return (
    <div className="space-y-6">
      {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="grid grid-cols-3 gap-y-3 text-sm">
            <dt className="text-muted">Name</dt><dd className="col-span-2">{me.fullName}</dd>
            <dt className="text-muted">Email</dt><dd className="col-span-2">{me.email}</dd>
            <dt className="text-muted">Roles</dt><dd className="col-span-2 space-x-1">{me.roles.map((r) => <Badge key={r}>{r.replace(/_/g, " ").toLowerCase()}</Badge>)}</dd>
            <dt className="text-muted">MFA</dt><dd className="col-span-2"><Badge tone={me.mfaEnabled ? "success" : "warning"}>{me.mfaEnabled ? "enabled" : "not enabled"}</Badge> <span className="text-xs text-muted">MFA enrolment arrives in a later phase.</span></dd>
          </dl>
        </Card>
        <Card title="Change password" description="Changing your password signs out all other sessions.">
          <form onSubmit={changePassword} className="space-y-4" noValidate>
            <Field label="Current password" htmlFor="pw-cur"><Input id="pw-cur" type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
            <Field label="New password" htmlFor="pw-new"><Input id="pw-new" type="password" autoComplete="new-password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
            <Field label="Confirm new password" htmlFor="pw-conf"><Input id="pw-conf" type="password" autoComplete="new-password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <PasswordRules />
            <Button type="submit" loading={pending === "pw"}>Change password</Button>
          </form>
        </Card>
      </div>
      <Card title="Active sessions" padded={false} actions={sessions.length > 1 ? <Button size="sm" variant="secondary" loading={pending === "all"} onClick={() => run("all", () => api("/auth/sessions/revoke-all", { method: "POST", body: {} }), "Other sessions signed out")}>Sign out other sessions</Button> : null}>
        <Table>
          <THead><TR><TH>Client</TH><TH>Device</TH><TH>IP</TH><TH>Started</TH><TH>Last used</TH><TH /></TR></THead>
          <TBody>
            {sessions.map((s) => (
              <TR key={s.id}>
                <TD><Badge>{s.client.toLowerCase()}</Badge>{s.current ? <Badge className="ml-1" tone="success">this device</Badge> : null}</TD>
                <TD className="max-w-64 truncate text-xs text-muted" title={s.userAgent ?? ""}>{s.userAgent ?? "—"}</TD>
                <TD className="text-xs">{s.ipAddress ?? "—"}</TD>
                <TD className="whitespace-nowrap text-xs">{formatDateTime(s.createdAt)}</TD>
                <TD className="whitespace-nowrap text-xs">{formatDateTime(s.lastUsedAt)}</TD>
                <TD className="text-right">{!s.current ? <Button size="sm" variant="ghost" loading={pending === s.id} onClick={() => run(s.id, () => api(`/auth/sessions/${s.id}`, { method: "DELETE" }), "Session revoked")}>Revoke</Button> : null}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
