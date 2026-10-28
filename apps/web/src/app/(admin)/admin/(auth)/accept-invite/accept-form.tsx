"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { PasswordRules } from "@/components/admin/password-rules";

export function AcceptInviteForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [invite, setInvite] = useState<{ email: string; fullName: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(token ? null : "This invitation link is missing its token.");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<{ email: string; fullName: string }>(`/auth/invitations?token=${encodeURIComponent(token)}`)
      .then((i) => {
        setInvite(i);
        setFullName(i.fullName);
      })
      .catch((err) => setLoadError(isApiError(err) ? err.message : "Could not load invitation."));
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    setPending(true);
    setError(null);
    try {
      await api("/auth/invitations/accept", { body: { token, password, fullName } });
      router.replace("/admin/login?reason=invited");
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details].join(" ") : "Request failed.");
      setPending(false);
    }
  }

  if (loadError) return <Alert tone="danger">{loadError}</Alert>;
  if (!invite) return <div className="space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-base font-semibold">Welcome, {invite.fullName}</h2>
        <p className="text-xs text-muted">Create a password for {invite.email}</p>
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="Full name" htmlFor="fullName">
        <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm">
        <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <PasswordRules />
      <Button type="submit" className="w-full" loading={pending}>
        Activate account
      </Button>
    </form>
  );
}
