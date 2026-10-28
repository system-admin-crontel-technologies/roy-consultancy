"use client";

import type { OrganisationSettings } from "@roy/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function OrganisationForm({ initial, timezones }: { initial: OrganisationSettings; timezones: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState({ ...initial, addressText: initial.addressLines.join("\n"), reminderText: initial.reminderDaysBeforeDue.join(", ") });
  const [error, setError] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { addressText, reminderText, ...rest } = s;
    const body: OrganisationSettings = {
      ...rest,
      addressLines: addressText.split("\n").map((l) => l.trim()).filter(Boolean),
      reminderDaysBeforeDue: reminderText.split(",").map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 0),
      financialYearStartMonth: Number(s.financialYearStartMonth),
    };
    try {
      await api("/settings/organisation", { method: "PUT", body });
      toast("success", "Organisation settings saved");
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? [err.message, ...err.details] : ["Request failed."]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card title="Organisation" description="Shown on documents and used for date, currency and financial-year handling.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        {error ? <div className="sm:col-span-2"><Alert tone="danger">{error.map((m, i) => <div key={i}>{m}</div>)}</Alert></div> : null}
        <Field label="Display name" htmlFor="o-name"><Input id="o-name" required value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></Field>
        <Field label="Legal name" htmlFor="o-legal"><Input id="o-legal" value={s.legalName} onChange={(e) => setS({ ...s, legalName: e.target.value })} /></Field>
        <Field label="Email" htmlFor="o-email"><Input id="o-email" type="email" value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></Field>
        <Field label="Phone" htmlFor="o-phone"><Input id="o-phone" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
        <Field label="Address" htmlFor="o-addr" hint="One line per row." className="sm:col-span-2"><Textarea id="o-addr" value={s.addressText} onChange={(e) => setS({ ...s, addressText: e.target.value })} /></Field>
        <Field label="GSTIN" htmlFor="o-gstin" hint="Shown on invoices once the finance module is enabled."><Input id="o-gstin" maxLength={15} value={s.gstin} onChange={(e) => setS({ ...s, gstin: e.target.value.toUpperCase() })} /></Field>
        <Field label="Timezone" htmlFor="o-tz">
          <Select id="o-tz" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })}>{timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}</Select>
        </Field>
        <Field label="Currency" htmlFor="o-cur"><Input id="o-cur" maxLength={3} value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value.toUpperCase() })} /></Field>
        <Field label="Date format" htmlFor="o-df">
          <Select id="o-df" value={s.dateFormat} onChange={(e) => setS({ ...s, dateFormat: e.target.value })}>{["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "DD MMM YYYY"].map((f) => <option key={f}>{f}</option>)}</Select>
        </Field>
        <Field label="Financial year starts in" htmlFor="o-fy">
          <Select id="o-fy" value={s.financialYearStartMonth} onChange={(e) => setS({ ...s, financialYearStartMonth: Number(e.target.value) })}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select>
        </Field>
        <Field label="Reminder days before due date" htmlFor="o-rem" hint="Comma separated, e.g. 30, 7, 1"><Input id="o-rem" value={s.reminderText} onChange={(e) => setS({ ...s, reminderText: e.target.value })} /></Field>
        <Field label="Notification sender name" htmlFor="o-from"><Input id="o-from" value={s.notificationFromName} onChange={(e) => setS({ ...s, notificationFromName: e.target.value })} /></Field>
        <Field label="Notification reply-to" htmlFor="o-reply"><Input id="o-reply" type="email" value={s.notificationReplyTo} onChange={(e) => setS({ ...s, notificationReplyTo: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Button type="submit" loading={pending}>Save settings</Button></div>
      </form>
    </Card>
  );
}
