"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CHIPS, DEFAULT_CHIP, isChip, type Chip } from "@/lib/site/content";

const INDIAN_PHONE = /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/;

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "sending" } | { kind: "sent"; name: string; service: Chip };

/**
 * Contact enquiry form. Reads `?service=` to preselect a chip and posts to the API through
 * the same-origin passthrough. Must be rendered inside <Suspense> (useSearchParams).
 */
export function EnquiryForm() {
  const params = useSearchParams();
  const preset = params.get("service");
  const [service, setService] = useState<Chip>(isChip(preset) ? preset : DEFAULT_CHIP);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      setStatus({ kind: "error", message: "Please add your name and phone number." });
      return;
    }
    if (!INDIAN_PHONE.test(trimmedPhone.replace(/[\s-]/g, ""))) {
      setStatus({ kind: "error", message: "Please enter a valid Indian mobile number, for example +91 98765 43210." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const honeypot = (form.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
      const res = await fetch("/api/v1/public/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: trimmedPhone, service, message: message.trim(), sourcePage: window.location.pathname + window.location.search, website: honeypot }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string; details?: string[] } | null;
        const detail = body?.details?.[0] ?? body?.message;
        setStatus({ kind: "error", message: res.status === 429 ? "Too many attempts. Please wait a minute and try again, or call us." : detail ?? "We could not send your enquiry. Please call or WhatsApp us instead." });
        return;
      }
      setStatus({ kind: "sent", name: trimmedName, service });
    } catch {
      setStatus({ kind: "error", message: "We could not reach the server. Please check your connection, or call or WhatsApp us instead." });
    }
  }

  function reset() {
    setName("");
    setPhone("");
    setMessage("");
    setStatus({ kind: "idle" });
  }

  if (status.kind === "sent") {
    return (
      <div className="s-form" role="status">
        <div className="s-form__done">
          <span className="s-form__done-title">Thank you, {status.name}.</span>
          <span className="s-form__done-text">Your enquiry about {status.service} has been received. We’ll be in touch within one working day.</span>
          <button type="button" className="s-btn s-btn--outline" onClick={reset}>
            Send another
          </button>
        </div>
      </div>
    );
  }

  const invalid = status.kind === "error";
  const sending = status.kind === "sending";
  return (
    <form className="s-form" onSubmit={submit} noValidate>
      <h3 className="s-form__title">Send an enquiry</h3>
      <label className="s-field">
        Name
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" aria-invalid={invalid && !name.trim() ? true : undefined} />
      </label>
      <label className="s-field">
        Phone / WhatsApp
        <input name="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91" autoComplete="tel" aria-invalid={invalid && !phone.trim() ? true : undefined} />
      </label>
      <div className="s-field s-field--chips" role="group" aria-label="Service">
        Service
        <div className="s-chips">
          {CHIPS.map((c) => (
            <button key={c} type="button" className="s-chip" aria-pressed={c === service} onClick={() => setService(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <label className="s-field">
        Message
        <textarea name="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Briefly describe your requirement" />
      </label>
      <div className="s-honeypot" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {status.kind === "error" ? (
        <span className="s-form__error" role="alert">
          {status.message}
        </span>
      ) : null}
      <button type="submit" className="s-btn s-btn--lg s-form__submit" disabled={sending}>
        {sending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
