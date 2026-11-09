"use client";

import type { GstCredential } from "@roy/types";
import { Check, Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
    <button type="button" onClick={onClick} className={iconBtn} aria-label={`Copy ${label.toLowerCase()}`} title={`Copy ${label.toLowerCase()}`}>
      {done ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
    </button>
  );
}

const iconBtn = "rounded p-2 text-muted hover:bg-slate-200 hover:text-foreground md:p-1.5";

/**
 * Table on desktop; on phones each row becomes a card (same elements, re-laid out with CSS)
 * so per-row state such as a revealed password is not duplicated.
 */
export function CredentialTable({ entries }: { entries: GstCredential[] }) {
  return (
    <div className="md:overflow-x-auto">
      <table className="w-full text-sm max-md:block">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted max-md:hidden">
          <tr>
            <th className="px-4 py-2.5 font-medium">Client name</th>
            <th className="px-4 py-2.5 font-medium">User ID</th>
            <th className="px-4 py-2.5 font-medium">Password</th>
            <th className="px-4 py-2.5 font-medium">Updated</th>
            <th className="w-20 px-4 py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border max-md:block">
          {entries.map((c) => <CredentialRow key={c.id} entry={c} />)}
        </tbody>
      </table>
    </div>
  );
}

function MobileLabel({ children }: { children: string }) {
  return <span className="block text-[11px] font-medium uppercase tracking-wide text-muted md:hidden">{children}</span>;
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
    <tr className="hover:bg-slate-50/60 max-md:grid max-md:grid-cols-[1fr_auto] max-md:gap-x-2 max-md:gap-y-2 max-md:px-4 max-md:py-4">
      <td className="px-4 py-3 align-middle font-medium max-md:col-start-1 max-md:row-start-1 max-md:self-center max-md:p-0 max-md:text-base">{entry.clientName}</td>
      <td className="px-4 py-3 align-middle max-md:col-span-2 max-md:p-0">
        <MobileLabel>User ID</MobileLabel>
        <div className="flex items-center gap-1">
          <span className="break-all font-mono text-xs max-md:text-sm">{entry.username}</span>
          <CopyButton label="User ID" getValue={() => entry.username} />
        </div>
      </td>
      <td className="px-4 py-3 align-middle max-md:col-span-2 max-md:p-0">
        <MobileLabel>Password</MobileLabel>
        <div className="flex items-center gap-1">
          <span className="min-w-24 break-all font-mono text-xs max-md:text-sm">{shown ?? "••••••••"}</span>
          <button type="button" onClick={toggleShow} className={iconBtn} aria-label={shown !== null ? "Hide password" : "Show password"} title={shown !== null ? "Hide password" : "Show password"}>
            {shown !== null ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <CopyButton label="Password" getValue={() => shown ?? revealPassword(entry.id)} />
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-muted max-md:col-span-2 max-md:p-0">
        <span className="md:hidden">Updated </span>{formatDateTime(entry.updatedAt)}
      </td>
      <td className="px-4 py-3 text-right align-middle max-md:col-start-2 max-md:row-start-1 max-md:p-0">
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => setEditing(true)} className={iconBtn} aria-label={`Edit ${entry.clientName}`} title="Edit">
            <Pencil className="size-4" />
          </button>
          <button type="button" onClick={() => setDeleting(true)} className="rounded p-2 text-muted hover:bg-red-50 hover:text-danger md:p-1.5" aria-label={`Delete ${entry.clientName}`} title="Delete">
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="text-left">
          <CredentialFormDialog open={editing} onClose={() => setEditing(false)} existing={entry} />
          <DeleteDialog entry={entry} open={deleting} onClose={() => setDeleting(false)} />
        </div>
      </td>
    </tr>
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
