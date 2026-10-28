"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export function CreateRoleButton() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const role = await api<{ id: string }>("/roles", { body: { code: form.code.toUpperCase(), name: form.name, description: form.description || undefined, permissions: [] } });
      toast("success", "Role created. Now grant its permissions.");
      setOpen(false);
      router.push(`/admin/roles/${role.id}`);
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
      setPending(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New role</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Create a custom role"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="role-form" loading={pending}>Create</Button></>}>
        <form id="role-form" onSubmit={submit} className="space-y-4" noValidate>
          {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
          <Field label="Code" htmlFor="r-code" hint="Upper-case letters, digits and underscores, e.g. SENIOR_REVIEWER">
            <Input id="r-code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Name" htmlFor="r-name"><Input id="r-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Description" htmlFor="r-desc"><Textarea id="r-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </form>
      </Dialog>
    </>
  );
}
