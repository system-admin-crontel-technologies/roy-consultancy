"use client";

import type { AuditLogEntry } from "@roy/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { Badge, statusTone } from "@/components/ui/badge";
import { TBody, TD, TR } from "@/components/ui/table";

export function AuditRows({ entries }: { entries: AuditLogEntry[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <TBody>
      {entries.map((e) => {
        const expanded = open === e.id;
        const hasDetail = e.before != null || e.after != null || e.metadata != null;
        return (
          <Fragment key={e.id}>
            <TR className={expanded ? "bg-slate-50" : undefined}>
              <TD>
                {hasDetail ? (
                  <button type="button" onClick={() => setOpen(expanded ? null : e.id)} className="rounded p-0.5 text-muted hover:bg-slate-200" aria-expanded={expanded} aria-label="Toggle details">
                    {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                ) : null}
              </TD>
              <TD className="whitespace-nowrap text-xs">{formatDateTime(e.occurredAt)}</TD>
              <TD className="max-w-52 truncate text-xs">{e.actorLabel ?? e.actorType.toLowerCase()}</TD>
              <TD className="font-mono text-xs">{e.action}</TD>
              <TD className="text-xs text-muted">{e.resourceType}{e.resourceId ? <span className="ml-1 font-mono text-[11px]" title={e.resourceId}>{e.resourceId.slice(0, 8)}…</span> : null}</TD>
              <TD><Badge tone={statusTone(e.outcome)}>{e.outcome.toLowerCase()}</Badge></TD>
              <TD className="text-xs text-muted">{e.ipAddress ?? "—"}</TD>
            </TR>
            {expanded ? (
              <TR className="bg-slate-50">
                <TD colSpan={7} className="px-6 pb-4 pt-0">
                  <div className="grid gap-3 md:grid-cols-3">
                    <JsonBlock title="Before" value={e.before} />
                    <JsonBlock title="After" value={e.after} />
                    <JsonBlock title="Metadata" value={{ ...(e.metadata as object ?? {}), correlationId: e.correlationId }} />
                  </div>
                </TD>
              </TR>
            ) : null}
          </Fragment>
        );
      })}
    </TBody>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <pre className="max-h-64 overflow-auto rounded-md border border-border bg-white p-2 text-[11px] leading-snug">{value == null ? "—" : JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
