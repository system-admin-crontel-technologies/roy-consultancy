"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { PasswordRules } from "@/components/admin/password-rules";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    setPending(true);
    setError(null);
    try {
      await api("/auth/password-reset/confirm", { body: { token, password } });
      router.replace("/admin/login?reason=reset");
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details].join(" ") : "Request failed.");
      setPending(false);
    }
  }

  if (!token) return <Alert tone="danger">This reset link is missing its token. Request a new one.</Alert>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h2 className="text-base font-semibold">Choose a new password</h2>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="New password" htmlFor="password">
        <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm">
        <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <PasswordRules />
      <Button type="submit" className="w-full" loading={pending}>
        Set password
      </Button>
      <p className="text-center text-xs text-muted">
        <Link href="/admin/login" className="hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
