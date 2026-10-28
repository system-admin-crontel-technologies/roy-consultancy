"use client";

import type { IntegrationSummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatDateTime, titleCase } from "@/lib/format";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

export function IntegrationsTable({ integrations }: { integrations: IntegrationSummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [checking, setChecking] = useState<string | null>(null);
  const [editing, setEditing] = useState<IntegrationSummary | null>(null);
  const [form, setForm] = useState({ name: "", provider: "", status: "NOT_CONFIGURED", secretRef: "", configText: "" });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  async function check(key: string) {
    setChecking(key);
    try {
      const r = await api<IntegrationSummary>(`/integrations/${key}/health-check`, { method: "POST", body: {} });
      toast(r.lastHealthOk ? "success" : "danger", r.lastHealthOk ? `${r.name}: healthy` : `${r.name}: ${r.lastError ?? "check failed"}`);
      router.refresh();
    } catch (err) {
      toast("danger", isApiError(err) ? err.message : "Health check failed.");
    } finally {
      setChecking(null);
    }
  }

  function open(i: IntegrationSummary) {
    setForm({ name: i.name, provider: i.provider ?? "", status: i.status === "ERROR" ? "ACTIVE" : i.status, secretRef: i.secretRef ?? "", configText: Object.entries(i.config ?? {}).map(([k, v]) => `${k}=${String(v)}`).join("\n") });
    setError(null);
    setEditing(i);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setPending(true);
    setError(null);
    const config: Record<string, string> = {};
    for (const line of form.configText.split("\n")) {
      const idx = line.indexOf("=");
      if (idx > 0) config[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    try {
      await api(`/integrations/${editing.key}`, { method: "PATCH", body: { name: form.name, provider: form.provider || null, status: form.status, secretRef: form.secretRef || null, config } });
      toast("success", "Integration updated");
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card padded={false}>
      <Table>
        <THead><TR><TH>Integration</TH><TH>Category</TH><TH>Provider</TH><TH>Status</TH><TH>Last check</TH><TH /></TR></THead>
        <TBody>
          {integrations.map((i) => (
            <TR key={i.key}>
              <TD>
                <span className="font-medium">{i.name}</span><span className="ml-2 font-mono text-xs text-muted">{i.key}</span>
                {i.lastError && i.status === "ERROR" ? <p className="max-w-md truncate text-xs text-danger" title={i.lastError}>{i.lastError}</p> : null}
              </TD>
              <TD className="text-muted">{titleCase(i.category)}</TD>
              <TD className="text-muted">{i.provider ?? "—"}</TD>
              <TD><Badge tone={statusTone(i.status)}>{i.status.replace(/_/g, " ").toLowerCase()}</Badge></TD>
              <TD className="whitespace-nowrap text-xs text-muted">{i.lastHealthCheckAt ? `${formatDateTime(i.lastHealthCheckAt)} · ${i.lastHealthOk ? "ok" : "failed"}` : "never"}</TD>
              <TD className="whitespace-nowrap text-right">
                <Button size="sm" variant="ghost" loading={checking === i.key} onClick={() => check(i.key)}>Check</Button>
                <Button size="sm" variant="ghost" onClick={() => open(i)}>Edit</Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {editing ? (
        <Dialog open onClose={() => setEditing(null)} title={`Edit ${editing.name}`} description="Non-secret configuration only. Reference secrets by environment variable or secret-store name."
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="int-form" loading={pending}>Save</Button></>}>
          <form id="int-form" onSubmit={submit} className="space-y-4" noValidate>
            {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="i-name"><Input id="i-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Provider" htmlFor="i-prov"><Input id="i-prov" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></Field>
              <Field label="Status" htmlFor="i-status">
                <Select id="i-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="NOT_CONFIGURED">Not configured</option><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option>
                </Select>
              </Field>
              <Field label="Secret reference" htmlFor="i-secret" hint="e.g. env:SMTP_PASSWORD"><Input id="i-secret" value={form.secretRef} onChange={(e) => setForm({ ...form, secretRef: e.target.value })} /></Field>
            </div>
            <Field label="Configuration (key=value per line)" htmlFor="i-config"><Textarea id="i-config" value={form.configText} onChange={(e) => setForm({ ...form, configText: e.target.value })} placeholder={"endpoint=https://...\nsender_id=ROYCON"} /></Field>
          </form>
        </Dialog>
      ) : null}
    </Card>
  );
}
