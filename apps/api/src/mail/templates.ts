function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;color:#1f2937">
<h2 style="margin-top:0">${esc(title)}</h2>${body}
<p style="color:#6b7280;font-size:12px;margin-top:32px">Roy Consultancy Operations Platform. If you did not expect this email, you can ignore it.</p>
</div></body></html>`;
}

export function renderInvitation(p: { name: string; invitedBy: string; link: string; expiresInHours: number }) {
  const subject = 'You have been invited to the Roy Consultancy platform';
  const text = `Hello ${p.name},\n\n${p.invitedBy} has invited you to the Roy Consultancy Operations Platform.\nSet your password using this link (valid for ${p.expiresInHours} hours):\n${p.link}\n`;
  const html = layout(
    'You are invited',
    `<p>Hello ${esc(p.name)},</p><p>${esc(p.invitedBy)} has invited you to the Roy Consultancy Operations Platform.</p>
<p><a href="${esc(p.link)}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Accept invitation</a></p>
<p>This link is valid for ${p.expiresInHours} hours.</p>`,
  );
  return { subject, text, html };
}

export function renderPasswordReset(p: { name: string; link: string; expiresInMinutes: number }) {
  const subject = 'Reset your Roy Consultancy password';
  const text = `Hello ${p.name},\n\nUse this link to set a new password (valid for ${p.expiresInMinutes} minutes):\n${p.link}\n\nIf you did not request this, ignore this email.\n`;
  const html = layout(
    'Reset your password',
    `<p>Hello ${esc(p.name)},</p><p>Use the button below to set a new password. The link is valid for ${p.expiresInMinutes} minutes.</p>
<p><a href="${esc(p.link)}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Reset password</a></p>`,
  );
  return { subject, text, html };
}

export interface EnquiryNotification {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  message: string | null;
  sourcePage: string | null;
}

export function renderEnquiryNotification(e: EnquiryNotification) {
  const subject = `New website enquiry: ${e.service} from ${e.name}`;
  const lines = [
    `Name: ${e.name}`,
    `Phone / WhatsApp: ${e.phone}`,
    `Email: ${e.email ?? '-'}`,
    `Service: ${e.service}`,
    `Message: ${e.message ?? '-'}`,
    `Page: ${e.sourcePage ?? '-'}`,
    `Reference: ${e.id}`,
  ];
  const text = `A new enquiry was submitted on the website.\n\n${lines.join('\n')}\n`;
  const row = (k: string, v: string) => `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`;
  const html = layout(
    'New website enquiry',
    `<table style="border-collapse:collapse;font-size:14px">${row('Name', e.name)}${row('Phone / WhatsApp', e.phone)}${row('Email', e.email ?? '-')}${row('Service', e.service)}${row('Message', e.message ?? '-')}${row('Page', e.sourcePage ?? '-')}${row('Reference', e.id)}</table>
<p><a href="tel:${esc(e.phone)}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Call ${esc(e.name)}</a></p>`,
  );
  return { subject, text, html };
}
