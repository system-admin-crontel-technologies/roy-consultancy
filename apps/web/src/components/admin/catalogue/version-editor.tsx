"use client";

import type { ChecklistItem, ServiceVersionSummary, TaskTemplateItem } from "@roy/types";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

const ROLES = ["COMPLIANCE_EXECUTIVE", "REVIEWER", "OPERATIONS_MANAGER", "SALES_EXECUTIVE", "FINANCE_EXECUTIVE", "BUSINESS_OWNER"];
type Labelled = { key: string; label: string };

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
}

export function VersionEditor({ serviceId, version }: { serviceId: string; version: ServiceVersionSummary }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({
    effectiveFrom: version.effectiveFrom,
    summary: version.summary ?? "",
    eligibilityNotes: version.eligibilityNotes ?? "",
    exclusions: version.exclusions ?? "",
    jurisdiction: version.jurisdiction ?? "",
    expectedTurnaroundDays: version.expectedTurnaroundDays?.toString() ?? "",
    billingType: version.billingType,
    recurrenceMonths: version.recurrenceMonths?.toString() ?? "",
  });
  const [inputs, setInputs] = useState<ChecklistItem[]>(version.requiredInputs);
  const [docs, setDocs] = useState<ChecklistItem[]>(version.requiredDocuments);
  const [tasks, setTasks] = useState<TaskTemplateItem[]>(version.taskTemplate);
  const [deliverables, setDeliverables] = useState<Labelled[]>(version.deliverables);
  const [closure, setClosure] = useState<Labelled[]>(version.closureCriteria);
  const [price, setPrice] = useState({
    currency: version.price?.currency ?? "INR",
    professionalFee: version.price ? (version.price.professionalFeeMinor / 100).toString() : "",
    governmentFee: version.price ? (version.price.governmentFeeMinor / 100).toString() : "0",
    thirdParty: version.price ? (version.price.thirdPartyChargesMinor / 100).toString() : "0",
    taxRate: version.price ? (version.price.taxRateBps / 100).toString() : "18",
    governmentFeeIsEstimate: version.price?.governmentFeeIsEstimate ?? true,
    notes: version.price?.notes ?? "",
  });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const base = `/catalogue/services/${serviceId}/versions/${version.id}`;

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

  const toMinor = (s: string) => Math.round(Number(s || 0) * 100);

  function saveContent() {
    return api(base, {
      method: "PATCH",
      body: {
        effectiveFrom: v.effectiveFrom,
        summary: v.summary || null,
        eligibilityNotes: v.eligibilityNotes || null,
        exclusions: v.exclusions || null,
        jurisdiction: v.jurisdiction || null,
        expectedTurnaroundDays: v.expectedTurnaroundDays ? Number(v.expectedTurnaroundDays) : null,
        billingType: v.billingType,
        recurrenceMonths: v.billingType === "ONE_TIME" ? null : v.recurrenceMonths ? Number(v.recurrenceMonths) : null,
        requiredInputs: inputs,
        requiredDocuments: docs,
        taskTemplate: tasks.map((t) => ({ ...t, dependsOn: t.dependsOn?.length ? t.dependsOn : undefined, targetDays: t.targetDays ?? undefined, reviewerGate: t.reviewerGate || undefined })),
        deliverables,
        closureCriteria: closure,
      },
    });
  }

  function savePrice() {
    return api(`${base}/price`, {
      method: "PUT",
      body: {
        currency: price.currency,
        professionalFeeMinor: toMinor(price.professionalFee),
        governmentFeeMinor: toMinor(price.governmentFee),
        thirdPartyChargesMinor: toMinor(price.thirdParty),
        taxRateBps: Math.round(Number(price.taxRate || 0) * 100),
        governmentFeeIsEstimate: price.governmentFeeIsEstimate,
        notes: price.notes || null,
      },
    });
  }

  return (
    <div className="space-y-6">
      <Alert tone="info">Draft version {version.versionNumber}. Save content and price, then publish to make it current.</Alert>
      {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Scope and guidance</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Effective from" htmlFor="v-eff"><Input id="v-eff" type="date" value={v.effectiveFrom} onChange={(e) => setV({ ...v, effectiveFrom: e.target.value })} /></Field>
          <Field label="Jurisdiction" htmlFor="v-jur"><Input id="v-jur" value={v.jurisdiction} onChange={(e) => setV({ ...v, jurisdiction: e.target.value })} /></Field>
          <Field label="Expected turnaround (days)" htmlFor="v-tat"><Input id="v-tat" type="number" min={0} value={v.expectedTurnaroundDays} onChange={(e) => setV({ ...v, expectedTurnaroundDays: e.target.value })} /></Field>
          <Field label="Billing type" htmlFor="v-bill">
            <Select id="v-bill" value={v.billingType} onChange={(e) => setV({ ...v, billingType: e.target.value as typeof v.billingType })}>
              <option value="ONE_TIME">One-time</option><option value="RECURRING">Recurring</option><option value="ANNUAL_PACKAGE">Annual package</option>
            </Select>
          </Field>
          {v.billingType !== "ONE_TIME" ? <Field label="Recurs every (months)" htmlFor="v-rec"><Input id="v-rec" type="number" min={1} max={60} value={v.recurrenceMonths} onChange={(e) => setV({ ...v, recurrenceMonths: e.target.value })} /></Field> : null}
        </div>
        <Field label="Summary" htmlFor="v-sum"><Textarea id="v-sum" value={v.summary} onChange={(e) => setV({ ...v, summary: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eligibility notes" htmlFor="v-eli" hint="Operational guidance only; verify against official sources."><Textarea id="v-eli" value={v.eligibilityNotes} onChange={(e) => setV({ ...v, eligibilityNotes: e.target.value })} /></Field>
          <Field label="Exclusions" htmlFor="v-exc"><Textarea id="v-exc" value={v.exclusions} onChange={(e) => setV({ ...v, exclusions: e.target.value })} /></Field>
        </div>
      </section>

      <ChecklistEditor title="Required client inputs" items={inputs} onChange={setInputs} />
      <ChecklistEditor title="Required documents" items={docs} onChange={setDocs} withSensitivity />
      <TaskEditor tasks={tasks} onChange={setTasks} />
      <LabelledEditor title="Deliverables" items={deliverables} onChange={setDeliverables} />
      <LabelledEditor title="Closure criteria" items={closure} onChange={setClosure} />

      <div className="flex gap-2">
        <Button loading={pending === "content"} onClick={() => run("content", saveContent, "Version content saved")}>Save content</Button>
      </div>

      <section className="space-y-4 rounded-md border border-border bg-slate-50 p-4">
        <h3 className="text-sm font-semibold">Pricing</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Professional fee (₹)" htmlFor="p-fee"><Input id="p-fee" type="number" min={0} step="0.01" value={price.professionalFee} onChange={(e) => setPrice({ ...price, professionalFee: e.target.value })} /></Field>
          <Field label="Government fee (₹)" htmlFor="p-gov"><Input id="p-gov" type="number" min={0} step="0.01" value={price.governmentFee} onChange={(e) => setPrice({ ...price, governmentFee: e.target.value })} /></Field>
          <Field label="Third-party charges (₹)" htmlFor="p-3p"><Input id="p-3p" type="number" min={0} step="0.01" value={price.thirdParty} onChange={(e) => setPrice({ ...price, thirdParty: e.target.value })} /></Field>
          <Field label="Tax on professional fee (%)" htmlFor="p-tax" hint="Configured rate; finance to confirm."><Input id="p-tax" type="number" min={0} max={100} step="0.01" value={price.taxRate} onChange={(e) => setPrice({ ...price, taxRate: e.target.value })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={price.governmentFeeIsEstimate} onChange={(e) => setPrice({ ...price, governmentFeeIsEstimate: e.target.checked })} /> Government fee is an estimate (actual charged at cost)</label>
        <Field label="Pricing notes" htmlFor="p-notes"><Textarea id="p-notes" value={price.notes} onChange={(e) => setPrice({ ...price, notes: e.target.value })} /></Field>
        <Button variant="secondary" loading={pending === "price"} onClick={() => run("price", savePrice, "Price saved")}>Save price</Button>
      </section>

      <div className="flex items-center justify-between rounded-md border border-border p-4">
        <p className="text-sm text-muted">Publishing freezes this version and makes it the current version for new orders.</p>
        <Button loading={pending === "publish"} onClick={() => run("publish", async () => { await saveContent(); if (price.professionalFee !== "") await savePrice(); await api(`${base}/publish`, { method: "POST", body: {} }); }, `Version ${version.versionNumber} published`)}>Publish version</Button>
      </div>
    </div>
  );
}

function ChecklistEditor({ title, items, onChange, withSensitivity }: { title: string; items: ChecklistItem[]; onChange: (i: ChecklistItem[]) => void; withSensitivity?: boolean }) {
  const update = (i: number, patch: Partial<ChecklistItem>) => onChange(items.map((it, n) => (n === i ? { ...it, ...patch } : it)));
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><Button size="sm" variant="secondary" onClick={() => onChange([...items, { key: "", label: "", required: true }])}><Plus className="size-3.5" /> Add</Button></div>
      {items.length === 0 ? <p className="text-xs text-muted">None yet.</p> : null}
      {items.map((it, i) => (
        <div key={i} className="grid items-center gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_1.5fr_auto_auto_auto]">
          <Input placeholder="key" value={it.key} onChange={(e) => update(i, { key: slug(e.target.value) })} aria-label="Key" />
          <Input placeholder="Label" value={it.label} onChange={(e) => update(i, { label: e.target.value, key: it.key || slug(e.target.value) })} aria-label="Label" />
          <label className="flex items-center gap-1 text-xs"><Checkbox checked={it.required} onChange={(e) => update(i, { required: e.target.checked })} /> required</label>
          {withSensitivity ? (
            <Select value={it.sensitivity ?? "GENERAL"} onChange={(e) => update(i, { sensitivity: e.target.value as ChecklistItem["sensitivity"] })} aria-label="Sensitivity" className="h-9 text-xs"><option value="GENERAL">general</option><option value="SENSITIVE">sensitive</option></Select>
          ) : <span />}
          <button type="button" className="rounded p-1 text-muted hover:bg-slate-100" aria-label="Remove" onClick={() => onChange(items.filter((_, n) => n !== i))}><Trash2 className="size-4" /></button>
        </div>
      ))}
    </section>
  );
}

function TaskEditor({ tasks, onChange }: { tasks: TaskTemplateItem[]; onChange: (t: TaskTemplateItem[]) => void }) {
  const update = (i: number, patch: Partial<TaskTemplateItem>) => onChange(tasks.map((t, n) => (n === i ? { ...t, ...patch } : t)));
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Task template</h3><Button size="sm" variant="secondary" onClick={() => onChange([...tasks, { key: "", title: "", role: ROLES[0]! }])}><Plus className="size-3.5" /> Add task</Button></div>
      {tasks.length === 0 ? <p className="text-xs text-muted">None yet.</p> : null}
      {tasks.map((t, i) => (
        <div key={i} className="grid items-center gap-2 rounded-md border border-border p-2 sm:grid-cols-[0.8fr_1.6fr_1fr_0.6fr_1fr_auto_auto]">
          <Input placeholder="key" value={t.key} onChange={(e) => update(i, { key: slug(e.target.value) })} aria-label="Key" />
          <Input placeholder="Title" value={t.title} onChange={(e) => update(i, { title: e.target.value, key: t.key || slug(e.target.value) })} aria-label="Title" />
          <Select value={t.role} onChange={(e) => update(i, { role: e.target.value })} aria-label="Role" className="h-9 text-xs">{ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ").toLowerCase()}</option>)}</Select>
          <Input type="number" min={0} placeholder="days" value={t.targetDays ?? ""} onChange={(e) => update(i, { targetDays: e.target.value ? Number(e.target.value) : undefined })} aria-label="Target days" />
          <Input placeholder="depends on (keys, comma separated)" value={t.dependsOn?.join(", ") ?? ""} onChange={(e) => update(i, { dependsOn: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} aria-label="Depends on" />
          <label className="flex items-center gap-1 text-xs"><Checkbox checked={!!t.reviewerGate} onChange={(e) => update(i, { reviewerGate: e.target.checked })} /> gate</label>
          <button type="button" className="rounded p-1 text-muted hover:bg-slate-100" aria-label="Remove" onClick={() => onChange(tasks.filter((_, n) => n !== i))}><Trash2 className="size-4" /></button>
        </div>
      ))}
    </section>
  );
}

function LabelledEditor({ title, items, onChange }: { title: string; items: Labelled[]; onChange: (i: Labelled[]) => void }) {
  const update = (i: number, patch: Partial<Labelled>) => onChange(items.map((it, n) => (n === i ? { ...it, ...patch } : it)));
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><Button size="sm" variant="secondary" onClick={() => onChange([...items, { key: "", label: "" }])}><Plus className="size-3.5" /> Add</Button></div>
      {items.length === 0 ? <p className="text-xs text-muted">None yet.</p> : null}
      {items.map((it, i) => (
        <div key={i} className="grid items-center gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_2fr_auto]">
          <Input placeholder="key" value={it.key} onChange={(e) => update(i, { key: slug(e.target.value) })} aria-label="Key" />
          <Input placeholder="Label" value={it.label} onChange={(e) => update(i, { label: e.target.value, key: it.key || slug(e.target.value) })} aria-label="Label" />
          <button type="button" className="rounded p-1 text-muted hover:bg-slate-100" aria-label="Remove" onClick={() => onChange(items.filter((_, n) => n !== i))}><Trash2 className="size-4" /></button>
        </div>
      ))}
    </section>
  );
}
