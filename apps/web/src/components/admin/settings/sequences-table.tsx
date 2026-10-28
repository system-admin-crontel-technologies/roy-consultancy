"use client";

import type { NumberingSequenceSummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

export function SequencesTable({ sequences }: { sequences: NumberingSequenceSummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<NumberingSequenceSummary | null>(null);
  const [form, setForm] = useState({ prefix: "", padding: 5, resetPolicy: "NEVER", nextValue: 1 });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  function open(s: NumberingSequenceSummary) {
    setForm({ prefix: s.prefix, padding: s.padding, resetPolicy: s.resetPolicy, nextValue: s.nextValue });
    setError(null);
    setEditing(s);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setPending(true);
    setError(null);
    try {
      await api(`/settings/sequences/${editing.key}`, { method: "PATCH", body: { prefix: form.prefix.toUpperCase(), padding: Number(form.padding), resetPolicy: form.resetPolicy, nextValue: Number(form.nextValue) } });
      toast("success", `${editing.label} updated`);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card title="Reference numbering" description="Human-readable numbers for cases, quotations, invoices and more. Values can only move forward." padded={false}>
      <Table>
        <THead><TR><TH>Sequence</TH><TH>Prefix</TH><TH>Padding</TH><TH>Reset</TH><TH>Next value</TH><TH>Preview</TH><TH /></TR></THead>
        <TBody>
          {sequences.map((s) => (
            <TR key={s.key}>
              <TD><span className="font-medium">{s.label}</span><span className="ml-2 font-mono text-xs text-muted">{s.key}</span></TD>
              <TD className="font-mono text-xs">{s.prefix || "—"}</TD>
              <TD className="tabular-nums">{s.padding}</TD>
              <TD className="text-muted">{s.resetPolicy.replace(/_/g, " ").toLowerCase()}</TD>
              <TD className="tabular-nums">{s.nextValue}</TD>
              <TD className="font-mono text-xs">{s.preview}</TD>
              <TD className="text-right"><Button size="sm" variant="ghost" onClick={() => open(s)}>Edit</Button></TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {editing ? (
        <Dialog open onClose={() => setEditing(null)} title={`Edit ${editing.label}`}
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="seq-form" loading={pending}>Save</Button></>}>
          <form id="seq-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            {error ? <div className="sm:col-span-2"><Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert></div> : null}
            <Field label="Prefix" htmlFor="q-prefix"><Input id="q-prefix" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} /></Field>
            <Field label="Padding" htmlFor="q-pad"><Input id="q-pad" type="number" min={3} max={10} value={form.padding} onChange={(e) => setForm({ ...form, padding: Number(e.target.value) })} /></Field>
            <Field label="Reset policy" htmlFor="q-reset">
              <Select id="q-reset" value={form.resetPolicy} onChange={(e) => setForm({ ...form, resetPolicy: e.target.value })}>
                <option value="NEVER">Never</option><option value="CALENDAR_YEAR">Every calendar year</option><option value="FINANCIAL_YEAR">Every financial year</option>
              </Select>
            </Field>
            <Field label="Next value" htmlFor="q-next" hint={`Cannot be lower than ${editing.nextValue}.`}><Input id="q-next" type="number" min={editing.nextValue} value={form.nextValue} onChange={(e) => setForm({ ...form, nextValue: Number(e.target.value) })} /></Field>
          </form>
        </Dialog>
      ) : null}
    </Card>
  );
}
