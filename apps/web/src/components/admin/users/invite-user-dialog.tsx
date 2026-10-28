"use client";

import type { RoleSummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

interface Department { id: string; code: string; name: string; isActive: boolean }

export function InviteUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite user</Button>
      {open ? <InviteUserDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function InviteUserDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({ email: "", fullName: "", phone: "", departmentId: "", roleCodes: [] as string[] });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    Promise.all([api<RoleSummary[]>("/roles"), api<Department[]>("/departments")])
      .then(([r, d]) => {
        setRoles(r.filter((x) => x.code !== "CLIENT_REPRESENTATIVE"));
        setDepartments(d.filter((x) => x.isActive));
      })
      .catch((e) => setError([isApiError(e) ? e.message : "Could not load roles."]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/users", {
        body: {
          email: form.email,
          fullName: form.fullName,
          ...(form.phone ? { phone: form.phone } : {}),
          ...(form.departmentId ? { departmentId: form.departmentId } : {}),
          roleCodes: form.roleCodes,
        },
      });
      toast("success", `Invitation sent to ${form.email}`);
      router.refresh();
      onClose();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="Invite a user" description="They will receive an email link to set their password."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="invite-form" loading={pending}>Send invitation</Button></>}>
      <form id="invite-form" onSubmit={submit} className="space-y-4" noValidate>
        {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
        <Field label="Full name" htmlFor="inv-name"><Input id="inv-name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
        <Field label="Email" htmlFor="inv-email"><Input id="inv-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="inv-phone"><Input id="inv-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Department" htmlFor="inv-dept">
            <Select id="inv-dept" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">None</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Roles</legend>
          {roles.length === 0 ? <p className="text-xs text-muted">Loading roles…</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => (
              <label key={r.code} className="flex items-start gap-2 rounded-md border border-border p-2 text-sm hover:bg-slate-50">
                <Checkbox
                  checked={form.roleCodes.includes(r.code)}
                  onChange={(e) => setForm({ ...form, roleCodes: e.target.checked ? [...form.roleCodes, r.code] : form.roleCodes.filter((c) => c !== r.code) })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">{r.name}</span>
                  <span className="block text-xs text-muted">{r.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
