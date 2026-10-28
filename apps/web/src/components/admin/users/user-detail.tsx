"use client";

import type { RoleSummary, SessionSummary, UserSummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Alert, PageHeader } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

interface Department { id: string; code: string; name: string; isActive: boolean }

export function UserDetail({ user, roles, departments, sessions }: { user: UserSummary; roles: RoleSummary[]; departments: Department[]; sessions: SessionSummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState({ fullName: user.fullName, phone: user.phone ?? "", departmentId: user.department?.id ?? "" });
  const [roleCodes, setRoleCodes] = useState(user.roles.map((r) => r.code));
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<null | "suspend" | "activate" | "disable">(null);

  function fail(err: unknown) {
    setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
  }

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setPending(key);
    setError(null);
    try {
      await fn();
      toast("success", success);
      router.refresh();
    } catch (err) {
      fail(err);
    } finally {
      setPending(null);
    }
  }

  function saveProfile(e: FormEvent) {
    e.preventDefault();
    void run("profile", () => api(`/users/${user.id}`, { method: "PATCH", body: { fullName: profile.fullName, phone: profile.phone || null, departmentId: profile.departmentId || null } }), "Profile saved");
  }

  const rolesChanged = JSON.stringify([...roleCodes].sort()) !== JSON.stringify(user.roles.map((r) => r.code).sort());

  return (
    <div className="mt-3 space-y-6">
      <PageHeader
        title={user.fullName}
        description={user.email}
        actions={
          <>
            <Badge tone={statusTone(user.status)}>{user.status.toLowerCase()}</Badge>
            {user.status === "INVITED" ? <Button variant="secondary" size="sm" loading={pending === "resend"} onClick={() => run("resend", () => api(`/users/${user.id}/resend-invite`, { method: "POST", body: {} }), "Invitation re-sent")}>Resend invite</Button> : null}
            {user.status === "ACTIVE" ? <Button variant="secondary" size="sm" onClick={() => setStatusAction("suspend")}>Suspend</Button> : null}
            {user.status === "SUSPENDED" || user.status === "DISABLED" ? <Button variant="secondary" size="sm" onClick={() => setStatusAction("activate")}>Reactivate</Button> : null}
            {user.status !== "DISABLED" ? <Button variant="danger" size="sm" onClick={() => setStatusAction("disable")}>Disable</Button> : null}
          </>
        }
      />
      {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <Field label="Full name" htmlFor="u-name"><Input id="u-name" required value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></Field>
            <Field label="Phone" htmlFor="u-phone"><Input id="u-phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            <Field label="Department" htmlFor="u-dept">
              <Select id="u-dept" value={profile.departmentId} onChange={(e) => setProfile({ ...profile, departmentId: e.target.value })}>
                <option value="">None</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <dl className="grid grid-cols-2 gap-2 text-xs text-muted">
              <dt>Last login</dt><dd>{formatDateTime(user.lastLoginAt)}</dd>
              <dt>Created</dt><dd>{formatDateTime(user.createdAt)}</dd>
            </dl>
            <Button type="submit" loading={pending === "profile"}>Save profile</Button>
          </form>
        </Card>

        <Card title="Roles" description="Changes apply to active sessions within 30 seconds.">
          <div className="space-y-2">
            {roles.map((r) => (
              <label key={r.code} className="flex items-start gap-2 rounded-md border border-border p-2 text-sm hover:bg-slate-50">
                <Checkbox className="mt-0.5" checked={roleCodes.includes(r.code)} onChange={(e) => setRoleCodes(e.target.checked ? [...roleCodes, r.code] : roleCodes.filter((c) => c !== r.code))} />
                <span><span className="font-medium">{r.name}</span><span className="block text-xs text-muted">{r.description}</span></span>
              </label>
            ))}
          </div>
          <Button className="mt-4" disabled={!rolesChanged || roleCodes.length === 0} loading={pending === "roles"} onClick={() => run("roles", () => api(`/users/${user.id}/roles`, { body: { roleCodes } }), "Roles updated")}>
            Save roles
          </Button>
        </Card>
      </div>

      <Card title="Active sessions" padded={false} actions={sessions.length ? <Button variant="secondary" size="sm" loading={pending === "revoke"} onClick={() => run("revoke", () => api(`/users/${user.id}/sessions/revoke-all`, { method: "POST", body: {} }), "All sessions revoked")}>Revoke all</Button> : null}>
        {sessions.length === 0 ? <p className="p-5 text-sm text-muted">No active sessions.</p> : (
          <Table>
            <THead><TR><TH>Client</TH><TH>Device</TH><TH>IP</TH><TH>Started</TH><TH>Last used</TH><TH>Expires</TH></TR></THead>
            <TBody>
              {sessions.map((s) => (
                <TR key={s.id}>
                  <TD><Badge>{s.client.toLowerCase()}</Badge></TD>
                  <TD className="max-w-64 truncate text-xs text-muted" title={s.userAgent ?? ""}>{s.userAgent ?? "—"}</TD>
                  <TD className="text-xs">{s.ipAddress ?? "—"}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(s.createdAt)}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(s.lastUsedAt)}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(s.expiresAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {statusAction ? (
        <ReasonDialog
          title={statusAction === "suspend" ? "Suspend user" : statusAction === "disable" ? "Disable user" : "Reactivate user"}
          description={statusAction === "disable" ? "Disabled users cannot sign in and all sessions are revoked. This is recorded in the audit log." : statusAction === "suspend" ? "Suspended users cannot sign in until reactivated." : "The user will be able to sign in again."}
          danger={statusAction === "disable"}
          pending={pending === "status"}
          onClose={() => setStatusAction(null)}
          onConfirm={(reason) => run("status", () => api(`/users/${user.id}/${statusAction}`, { body: { reason } }), "Status updated").then(() => setStatusAction(null))}
        />
      ) : null}
    </div>
  );
}

export function ReasonDialog({ title, description, danger, pending, onClose, onConfirm }: { title: string; description?: string; danger?: boolean; pending: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open onClose={onClose} title={title} description={description}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={danger ? "danger" : "primary"} disabled={reason.trim().length < 3} loading={pending} onClick={() => onConfirm(reason.trim())}>Confirm</Button></>}>
      <Field label="Reason (recorded in the audit log)" htmlFor="reason">
        <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Minimum 3 characters" />
      </Field>
    </Dialog>
  );
}
