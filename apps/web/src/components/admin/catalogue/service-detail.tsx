"use client";

import type { ServiceCategorySummary, ServiceSummary, ServiceVersionSummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatDate, formatDateTime, formatMinor } from "@/lib/format";
import { ReasonDialog } from "@/components/admin/users/user-detail";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { VersionEditor } from "./version-editor";

type Service = ServiceSummary & { versions: ServiceVersionSummary[] };

export function ServiceDetail({ service, categories }: { service: Service; categories: ServiceCategorySummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [meta, setMeta] = useState({ name: service.name, categoryId: service.category.id, shortDescription: service.shortDescription ?? "", reviewCadenceDays: service.reviewCadenceDays?.toString() ?? "" });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [retire, setRetire] = useState(false);
  const [selected, setSelected] = useState<string>(service.versions[0]?.id ?? "");
  const version = service.versions.find((v) => v.id === selected) ?? service.versions[0];
  const latestIsDraft = service.versions[0] && !service.versions[0].publishedAt;

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

  const base = `/catalogue/services/${service.id}`;

  return (
    <div className="mt-3 space-y-6">
      <PageHeader
        title={service.name}
        description={`${service.code} · ${service.category.name}${service.lastVerifiedAt ? ` · guidance verified ${formatDate(service.lastVerifiedAt)}` : " · guidance not yet verified"}`}
        actions={
          <>
            <Badge tone={statusTone(service.status)}>{service.status.toLowerCase()}</Badge>
            {service.isDemo ? <Badge tone="warning">demo</Badge> : null}
            <Button variant="secondary" size="sm" loading={pending === "verify"} onClick={() => run("verify", () => api(`${base}/verify`, { method: "POST", body: {} }), "Marked as verified today")}>Mark verified</Button>
            {service.status === "DRAFT" || service.status === "PAUSED" ? <Button size="sm" loading={pending === "status"} onClick={() => run("status", () => api(`${base}/status`, { body: { status: "ACTIVE" } }), "Service activated")}>Activate</Button> : null}
            {service.status === "ACTIVE" ? <Button variant="secondary" size="sm" loading={pending === "status"} onClick={() => run("status", () => api(`${base}/status`, { body: { status: "PAUSED" } }), "Service paused")}>Pause</Button> : null}
            {service.status !== "RETIRED" ? <Button variant="danger" size="sm" onClick={() => setRetire(true)}>Retire</Button> : null}
          </>
        }
      />
      {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}

      <Card title="Service details">
        <form
          className="grid gap-4 sm:grid-cols-2"
          noValidate
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void run("meta", () => api(base, { method: "PATCH", body: { name: meta.name, categoryId: meta.categoryId, shortDescription: meta.shortDescription || null, reviewCadenceDays: meta.reviewCadenceDays ? Number(meta.reviewCadenceDays) : null } }), "Service details saved");
          }}
        >
          <Field label="Name" htmlFor="sv-name"><Input id="sv-name" required value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></Field>
          <Field label="Category" htmlFor="sv-cat">
            <Select id="sv-cat" value={meta.categoryId} onChange={(e) => setMeta({ ...meta, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Short description" htmlFor="sv-desc" className="sm:col-span-2"><Textarea id="sv-desc" value={meta.shortDescription} onChange={(e) => setMeta({ ...meta, shortDescription: e.target.value })} /></Field>
          <Field label="Guidance review cadence (days)" htmlFor="sv-cad" hint="How often the eligibility notes and checklist should be re-verified."><Input id="sv-cad" type="number" min={7} max={730} value={meta.reviewCadenceDays} onChange={(e) => setMeta({ ...meta, reviewCadenceDays: e.target.value })} /></Field>
          <div className="flex items-end"><Button type="submit" loading={pending === "meta"}>Save details</Button></div>
        </form>
      </Card>

      <Card
        title="Versions"
        description="Published versions are immutable. Create a new version to change the checklist, tasks or pricing."
        actions={!latestIsDraft ? <Button size="sm" loading={pending === "newv"} onClick={() => run("newv", () => api(`${base}/versions`, { method: "POST", body: {} }), "New draft version created")}>New draft version</Button> : null}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {service.versions.map((v) => (
            <button key={v.id} type="button" onClick={() => setSelected(v.id)} className={`rounded-md border px-3 py-1.5 text-xs font-medium ${v.id === version?.id ? "border-slate-900 bg-slate-900 text-white" : "border-border bg-white hover:bg-slate-50"}`}>
              v{v.versionNumber} {v.isCurrent ? "· current" : v.publishedAt ? "· published" : "· draft"}
            </button>
          ))}
        </div>
        {version ? (
          version.publishedAt ? <PublishedVersion version={version} /> : <VersionEditor key={version.id} serviceId={service.id} version={version} />
        ) : (
          <p className="text-sm text-muted">No versions.</p>
        )}
      </Card>

      {retire ? (
        <ReasonDialog title="Retire service" description="Retired services stay visible on historical cases but cannot be sold." danger pending={pending === "status"} onClose={() => setRetire(false)}
          onConfirm={(reason) => run("status", () => api(`${base}/status`, { body: { status: "RETIRED", reason } }), "Service retired").then(() => setRetire(false))} />
      ) : null}
    </div>
  );
}

function PublishedVersion({ version: v }: { version: ServiceVersionSummary }) {
  const p = v.price;
  const total = p ? p.professionalFeeMinor + p.governmentFeeMinor + p.thirdPartyChargesMinor + Math.round((p.professionalFeeMinor * p.taxRateBps) / 10_000) : 0;
  return (
    <div className="space-y-5 text-sm">
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Effective" value={`${v.effectiveFrom}${v.effectiveTo ? ` → ${v.effectiveTo}` : ""}`} />
        <Info label="Published" value={formatDateTime(v.publishedAt)} />
        <Info label="Billing" value={`${v.billingType.replace(/_/g, " ").toLowerCase()}${v.recurrenceMonths ? ` · every ${v.recurrenceMonths} months` : ""}`} />
        <Info label="Jurisdiction" value={v.jurisdiction ?? "—"} />
        <Info label="Turnaround" value={v.expectedTurnaroundDays != null ? `${v.expectedTurnaroundDays} days` : "—"} />
        <Info label="Price (indicative total)" value={p ? formatMinor(total, p.currency) : "—"} />
      </div>
      {p ? (
        <div className="grid gap-3 rounded-md border border-border bg-slate-50 p-3 sm:grid-cols-4">
          <Info label="Professional fee" value={formatMinor(p.professionalFeeMinor, p.currency)} />
          <Info label={`Government fee${p.governmentFeeIsEstimate ? " (estimate)" : ""}`} value={formatMinor(p.governmentFeeMinor, p.currency)} />
          <Info label="Third-party charges" value={formatMinor(p.thirdPartyChargesMinor, p.currency)} />
          <Info label="Tax on professional fee" value={`${(p.taxRateBps / 100).toFixed(2)}%`} />
        </div>
      ) : null}
      {v.summary ? <Info label="Summary" value={v.summary} /> : null}
      {v.eligibilityNotes ? <Info label="Eligibility" value={v.eligibilityNotes} /> : null}
      {v.exclusions ? <Info label="Exclusions" value={v.exclusions} /> : null}
      <ListBlock title="Required inputs" items={v.requiredInputs.map((i) => `${i.label}${i.required ? "" : " (optional)"}${i.conditional ? ` — ${i.conditional}` : ""}`)} />
      <ListBlock title="Required documents" items={v.requiredDocuments.map((i) => `${i.label}${i.required ? "" : " (optional)"}${i.sensitivity === "SENSITIVE" ? " · sensitive" : ""}`)} />
      <ListBlock title="Task template" items={v.taskTemplate.map((t) => `${t.title} · ${t.role.replace(/_/g, " ").toLowerCase()}${t.targetDays != null ? ` · ${t.targetDays}d` : ""}${t.reviewerGate ? " · review gate" : ""}${t.dependsOn?.length ? ` · after ${t.dependsOn.join(", ")}` : ""}`)} />
      <ListBlock title="Deliverables" items={v.deliverables.map((d) => d.label)} />
      <ListBlock title="Closure criteria" items={v.closureCriteria.map((d) => d.label)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      {items.length === 0 ? <p className="mt-0.5 text-muted">None</p> : <ol className="mt-1 list-decimal space-y-0.5 pl-5">{items.map((i, n) => <li key={n}>{i}</li>)}</ol>}
    </div>
  );
}
