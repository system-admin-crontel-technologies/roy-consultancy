"use client";

import type { RoleSummary } from "@roy/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { titleCase } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

type Permission = { code: string; module: string; description: string };

export function RoleEditor({ role, permissions }: { role: RoleSummary; permissions: Permission[] }) {
  const router = useRouter();
  const toast = useToast();
  const locked = role.code === "SUPER_ADMIN";
  const [meta, setMeta] = useState({ name: role.name, description: role.description ?? "" });
  const [granted, setGranted] = useState<Set<string>>(new Set(role.permissions));
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const modules = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) map.set(p.module, [...(map.get(p.module) ?? []), p]);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const changed = useMemo(() => {
    const a = [...granted].sort().join(",");
    const b = [...role.permissions].sort().join(",");
    return a !== b;
  }, [granted, role.permissions]);

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setPending(key);
    setError(null);
    try {
      await fn();
      toast("success", success);
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
    } finally {
      setPending(null);
    }
  }

  function toggleModule(codes: string[], on: boolean) {
    const next = new Set(granted);
    for (const c of codes) {
      if (on) next.add(c);
      else next.delete(c);
    }
    setGranted(next);
  }

  return (
    <div className="mt-3 space-y-6">
      <PageHeader title={role.name} description={`${role.code} · ${role.userCount} user${role.userCount === 1 ? "" : "s"}`} actions={role.isSystem ? <Badge tone="info">system role</Badge> : <Badge>custom role</Badge>} />
      {error ? <Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert> : null}
      {locked ? <Alert tone="info">Super Admin holds every permission. Its grants cannot be edited.</Alert> : null}

      <Card title="Details">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void run("meta", () => api(`/roles/${role.id}`, { method: "PATCH", body: { name: meta.name, description: meta.description || null } }), "Role details saved");
          }}
          noValidate
        >
          <Field label="Name" htmlFor="role-name"><Input id="role-name" required value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></Field>
          <Field label="Description" htmlFor="role-desc" className="sm:col-span-2"><Textarea id="role-desc" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Button type="submit" loading={pending === "meta"}>Save details</Button></div>
        </form>
      </Card>

      <Card
        title="Permissions"
        description={locked ? "All permissions granted." : `${granted.size} of ${permissions.length} granted`}
        actions={!locked ? <Button disabled={!changed} loading={pending === "perms"} onClick={() => run("perms", () => api(`/roles/${role.id}/permissions`, { method: "PUT", body: { permissions: [...granted] } }), "Permissions saved")}>Save permissions</Button> : null}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map(([module, perms]) => {
            const codes = perms.map((p) => p.code);
            const allOn = codes.every((c) => locked || granted.has(c));
            return (
              <fieldset key={module} className="rounded-md border border-border">
                <legend className="sr-only">{module}</legend>
                <div className="flex items-center justify-between border-b border-border bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">{titleCase(module)}</span>
                  {!locked ? (
                    <button type="button" className="text-xs text-accent hover:underline" onClick={() => toggleModule(codes, !allOn)}>
                      {allOn ? "Clear all" : "Select all"}
                    </button>
                  ) : null}
                </div>
                <div className="divide-y divide-border">
                  {perms.map((p) => (
                    <label key={p.code} className="flex items-start gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                      <Checkbox className="mt-0.5" disabled={locked} checked={locked || granted.has(p.code)} onChange={(e) => toggleModule([p.code], e.target.checked)} />
                      <span>
                        <span className="font-mono text-xs">{p.code}</span>
                        <span className="block text-xs text-muted">{p.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
