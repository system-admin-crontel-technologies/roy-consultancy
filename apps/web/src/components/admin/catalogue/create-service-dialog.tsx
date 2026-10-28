"use client";

import type { ServiceCategorySummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export function CreateServiceButton() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ServiceCategorySummary[]>([]);
  const [form, setForm] = useState({ code: "", name: "", categoryId: "", shortDescription: "" });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    api<ServiceCategorySummary[]>("/catalogue/categories").then((c) => setCategories(c.filter((x) => x.isActive))).catch(() => setCategories([]));
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const s = await api<{ id: string }>("/catalogue/services", { body: { code: form.code.toUpperCase(), name: form.name, categoryId: form.categoryId, shortDescription: form.shortDescription || null } });
      toast("success", "Draft service created");
      setOpen(false);
      router.push(`/admin/catalogue/services/${s.id}`);
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
      setPending(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New service</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Create a service" description="It starts as a draft with an empty version 1."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="svc-form" loading={pending}>Create draft</Button></>}>
        <form id="svc-form" onSubmit={submit} className="space-y-4" noValidate>
          {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor="s-code" hint="e.g. GST-REG"><Input id="s-code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Category" htmlFor="s-cat">
              <Select id="s-cat" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Name" htmlFor="s-name"><Input id="s-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Short description" htmlFor="s-desc"><Textarea id="s-desc" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></Field>
        </form>
      </Dialog>
    </>
  );
}
