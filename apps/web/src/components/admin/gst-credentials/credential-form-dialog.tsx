"use client";

import type { GstCredential } from "@roy/types";
import { Eye, EyeOff, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

/** Add (no `existing`) or edit a GST portal login. When editing, a blank password keeps the stored one. */
export function CredentialFormDialog({ open, onClose, existing }: { open: boolean; onClose: () => void; existing?: GstCredential }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ clientName: existing?.clientName ?? "", username: existing?.username ?? "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);
  const formId = existing ? `gst-form-${existing.id}` : "gst-form-new";

  function close() {
    setError(null);
    setShow(false);
    setForm({ clientName: existing?.clientName ?? "", username: existing?.username ?? "", password: "" });
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (existing) {
        await api(`/gst-credentials/${existing.id}`, {
          method: "PATCH",
          body: { clientName: form.clientName, username: form.username, ...(form.password ? { password: form.password } : {}) },
        });
        toast("success", "Login updated");
      } else {
        await api("/gst-credentials", { body: form });
        toast("success", "Client login added");
      }
      close();
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={existing ? "Edit GST portal login" : "Add GST portal login"}
      description="Login for the official GST portal (gst.gov.in). The password is stored encrypted."
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form={formId} loading={pending}>{existing ? "Save" : "Add"}</Button></>}
    >
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate autoComplete="off">
        {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
        <Field label="Client name" htmlFor={`${formId}-client`}>
          <Input id={`${formId}-client`} required maxLength={200} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
        </Field>
        <Field label="User ID" htmlFor={`${formId}-user`}>
          <Input id={`${formId}-user`} required maxLength={100} autoComplete="off" spellCheck={false} className="font-mono" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </Field>
        <Field label="Password" htmlFor={`${formId}-pass`} hint={existing ? "Leave blank to keep the current password." : undefined}>
          <div className="relative">
            <Input
              id={`${formId}-pass`}
              type={show ? "text" : "password"}
              required={!existing}
              maxLength={200}
              autoComplete="new-password"
              spellCheck={false}
              className="pr-10 font-mono"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      </form>
    </Dialog>
  );
}

export function AddCredentialButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden />Add client</Button>
      <CredentialFormDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
