"use client";

import type { ServiceCategorySummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

type FormState = { code: string; name: string; description: string; parentId: string; sortOrder: number; isActive: boolean };
const empty: FormState = { code: "", name: "", description: "", parentId: "", sortOrder: 0, isActive: true };

export function CategoriesTable({ categories }: { categories: ServiceCategorySummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);
  const byId = new Map(categories.map((c) => [c.id, c]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setPending(true);
    setError(null);
    const body = { code: editing.form.code.toUpperCase(), name: editing.form.name, description: editing.form.description || null, parentId: editing.form.parentId || null, sortOrder: Number(editing.form.sortOrder), isActive: editing.form.isActive };
    try {
      if (editing.id) await api(`/catalogue/categories/${editing.id}`, { method: "PATCH", body });
      else await api("/catalogue/categories", { body });
      toast("success", editing.id ? "Category updated" : "Category created");
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card padded={false} title="Categories" actions={<Button size="sm" onClick={() => setEditing({ id: null, form: empty })}>New category</Button>}>
      <Table>
        <THead><TR><TH>Name</TH><TH>Code</TH><TH>Parent</TH><TH>Services</TH><TH>Order</TH><TH>Status</TH><TH /></TR></THead>
        <TBody>
          {categories.map((c) => (
            <TR key={c.id}>
              <TD>
                <span className="font-medium">{c.name}</span>
                {c.isDemo ? <Badge className="ml-2" tone="warning">demo</Badge> : null}
                {c.description ? <p className="max-w-md text-xs text-muted">{c.description}</p> : null}
              </TD>
              <TD className="font-mono text-xs">{c.code}</TD>
              <TD className="text-muted">{c.parentId ? byId.get(c.parentId)?.name ?? "—" : "—"}</TD>
              <TD className="tabular-nums">{c.serviceCount}</TD>
              <TD className="tabular-nums">{c.sortOrder}</TD>
              <TD>{c.isActive ? <Badge tone="success">active</Badge> : <Badge>inactive</Badge>}</TD>
              <TD className="text-right">
                <Button size="sm" variant="ghost" onClick={() => setEditing({ id: c.id, form: { code: c.code, name: c.name, description: c.description ?? "", parentId: c.parentId ?? "", sortOrder: c.sortOrder, isActive: c.isActive } })}>Edit</Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {editing ? (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? "Edit category" : "New category"}
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="cat-form" loading={pending}>Save</Button></>}>
          <form id="cat-form" onSubmit={submit} className="space-y-4" noValidate>
            {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" htmlFor="c-code"><Input id="c-code" required value={editing.form.code} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, code: e.target.value.toUpperCase() } })} /></Field>
              <Field label="Sort order" htmlFor="c-sort"><Input id="c-sort" type="number" min={0} value={editing.form.sortOrder} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, sortOrder: Number(e.target.value) } })} /></Field>
            </div>
            <Field label="Name" htmlFor="c-name"><Input id="c-name" required value={editing.form.name} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, name: e.target.value } })} /></Field>
            <Field label="Parent category" htmlFor="c-parent">
              <Select id="c-parent" value={editing.form.parentId} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, parentId: e.target.value } })}>
                <option value="">None (top level)</option>
                {categories.filter((c) => c.id !== editing.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Description" htmlFor="c-desc"><Textarea id="c-desc" value={editing.form.description} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, description: e.target.value } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={editing.form.isActive} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, isActive: e.target.checked } })} /> Active</label>
          </form>
        </Dialog>
      ) : null}
    </Card>
  );
}
