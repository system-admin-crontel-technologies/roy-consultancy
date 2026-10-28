"use client";

import type { EnquiryStatus, WebsiteEnquiry } from "@roy/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import { TBody, TD, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

const STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];
const tone: Record<EnquiryStatus, Tone> = { NEW: "info", CONTACTED: "warning", CONVERTED: "success", CLOSED: "neutral" };

export function EnquiryRows({ entries }: { entries: WebsiteEnquiry[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <TBody>
      {entries.map((e) => {
        const expanded = open === e.id;
        return (
          <Fragment key={e.id}>
            <TR className={expanded ? "bg-slate-50" : undefined}>
              <TD>
                <button type="button" onClick={() => setOpen(expanded ? null : e.id)} className="rounded p-0.5 text-muted hover:bg-slate-200" aria-expanded={expanded} aria-label="Toggle details">
                  {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              </TD>
              <TD className="whitespace-nowrap text-xs">{formatDateTime(e.createdAt)}</TD>
              <TD className="font-medium">{e.name}</TD>
              <TD className="font-mono text-xs"><a href={`tel:${e.phone}`} className="hover:underline">{e.phone}</a></TD>
              <TD className="text-xs">{e.service}</TD>
              <TD><Badge tone={tone[e.status]}>{e.status.toLowerCase()}</Badge></TD>
            </TR>
            {expanded ? (
              <TR className="bg-slate-50">
                <TD colSpan={6} className="px-6 pb-4 pt-0">
                  <EnquiryDetail entry={e} />
                </TD>
              </TR>
            ) : null}
          </Fragment>
        );
      })}
    </TBody>
  );
}

function EnquiryDetail({ entry }: { entry: WebsiteEnquiry }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<EnquiryStatus>(entry.status);
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      try {
        await api(`/enquiries/${entry.id}`, { method: "PATCH", body: { status, notes: notes.trim() || null } });
        toast("success", "Enquiry updated");
        router.refresh();
      } catch (err) {
        toast("danger", err instanceof Error ? err.message : "Could not update enquiry");
      }
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 text-sm">
        <p><span className="text-xs font-medium uppercase tracking-wide text-muted">Message</span><br />{entry.message ? <span className="whitespace-pre-wrap">{entry.message}</span> : <span className="text-muted">—</span>}</p>
        <p className="text-xs text-muted">
          {entry.email ? <>Email: <a href={`mailto:${entry.email}`} className="hover:underline">{entry.email}</a> · </> : null}
          Page: {entry.sourcePage ?? "—"}
          {entry.handledAt ? <> · Last handled {formatDateTime(entry.handledAt)}</> : null}
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">
          Status
          <Select value={status} onChange={(e) => setStatus(e.target.value as EnquiryStatus)} className="mt-1">
            {STATUSES.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
          </Select>
        </label>
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">
          Internal notes
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1" placeholder="Call outcome, next step…" />
        </label>
        <Button type="button" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}
