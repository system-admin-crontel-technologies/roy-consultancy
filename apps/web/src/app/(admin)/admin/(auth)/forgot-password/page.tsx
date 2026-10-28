"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/auth/password-reset/request", { body: { email } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h2 className="text-base font-semibold">Reset your password</h2>
      {done ? (
        <Alert tone="success">If an account exists for that email, a reset link has been sent. It is valid for a limited time.</Alert>
      ) : (
        <>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" loading={pending}>
            Send reset link
          </Button>
        </>
      )}
      <p className="text-center text-xs text-muted">
        <Link href="/admin/login" className="hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
