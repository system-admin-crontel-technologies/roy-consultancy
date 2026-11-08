"use client";

import type { GstCredential } from "@roy/types";
import { Check, Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TBody, TD, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { CredentialFormDialog } from "./credential-form-dialog";

const revealPassword = (id: string) => api<{ password: string }>(`/gst-credentials/${id}/reveal`, { method: "POST", body: {} }).then((r) => r.password);

/**
 * Copies text that may still be loading. Passing a promise to ClipboardItem keeps the click's
 * user activation alive across the network round trip (needed by Safari); otherwise fall back to writeText.
 */
async function copyText(value: string | Promise<string>) {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const blob = Promise.resolve(value).then((v) => new Blob([v], { type: "text/plain" }));
    await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
    return;
  }
  await navigator.clipboard.writeText(await value);
}

function CopyButton({ label, getValue }: { label: string; getValue: () => string | Promise<string> }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  async function onClick() {
    try {
      await copyText(getValue());
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      toast("success", `${label} copied`);
    } catch (err) {
      toast("danger", err instanceof Error && err.message ? err.message : `Could not copy ${label.toLowerCase()}`);
    }
  }
  return (
    <button type="button" onClick={onClick} className="rounded p-1.5 text-muted hover:bg-slate-200 hover:text-foreground" aria-label={`Copy ${label.toLowerCase()}`} title={`Copy ${label.toLowerCase()}`}>
      {done ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
    </button>
  );
}

export function CredentialRows({ entries }: { entries: GstCredential[] }) {
  return (
    <TBody>
      {entries.map((c) => <CredentialRow key={c.id} entry={c} />)}
    </TBody>
  );
}

function CredentialRow({ entry }: { entry: GstCredential }) {
  const toast = useToast();
  const [shown, setShown] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleShow() {
    if (shown !== null) return setShown(null);
    try {
      setShown(await revealPassword(entry.id));
    } catch (err) {
      toast("danger", err instanceof Error ? err.message : "Could not load the password");
    }
  }

  return (
    <TR>
      <TD className="font-medium">{entry.clientName}</TD>
      <TD>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs">{entry.username}</span>
          <CopyButton label="User ID" getValue={() => entry.username} />
        </div>
      </TD>
      <TD>
        <div className="flex items-center gap-1">
          <span className="min-w-24 font-mono text-xs">{shown ?? "••••••••"}</span>
          <button type="button" onClick={toggleShow} className="rounded p-1.5 text-muted hover:bg-slate-200 hover:text-foreground" aria-label={shown !== null ? "Hide password" : "Show password"} title={shown !== null ? "Hide password" : "Show password"}>
            {shown !== null ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <CopyButton label="Password" getValue={() => shown ?? revealPassword(entry.id)} />
        </div>
      </TD>
      <TD className="whitespace-nowrap text-xs text-muted">{formatDateTime(entry.updatedAt)}</TD>
      <TD className="text-right">
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => setEditing(true)} className="rounded p-1.5 text-muted hover:bg-slate-200 hover:text-foreground" aria-label={`Edit ${entry.clientName}`} title="Edit">
            <Pencil className="size-4" />
          </button>
          <button type="button" onClick={() => setDeleting(true)} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-danger" aria-label={`Delete ${entry.clientName}`} title="Delete">
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="text-left">
          <CredentialFormDialog open={editing} onClose={() => setEditing(false)} existing={entry} />
          <DeleteDialog entry={entry} open={deleting} onClose={() => setDeleting(false)} />
        </div>
      </TD>
    </TR>
  );
}

function DeleteDialog({ entry, open, onClose }: { entry: GstCredential; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  async function confirm() {
    setPending(true);
    try {
      await api(`/gst-credentials/${entry.id}`, { method: "DELETE" });
      toast("success", "Login deleted");
      onClose();
      router.refresh();
    } catch (err) {
      toast("danger", err instanceof Error ? err.message : "Could not delete");
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Delete this login?"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={confirm} loading={pending}>Delete</Button></>}>
      <p className="text-sm">The GST portal login for <strong>{entry.clientName}</strong> ({entry.username}) will be removed permanently.</p>
    </Dialog>
  );
}
