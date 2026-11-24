import 'server-only';
import { logServerError } from '../server-error';
/**
 * Sends an email notification via Resend. Requires RESEND_API_KEY.
 * Without it, silently no-ops (logs to console) rather than throwing.
 */
export async function sendEmailNotification({ to, subject, body }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.NOTIFICATIONS_FROM_EMAIL || 'NPC <notifications@npc.ng>';

  if (!apiKey) {
    return { skipped: true };
  }
  if (!to) return { skipped: true };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to,
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logServerError('email.resend_rejected', new Error(errText));
      return { skipped: true, error: 'Email delivery failed.' };
    }
    return { skipped: false };
  } catch (err) {
    logServerError('email.resend_request', err);
    return { skipped: true, error: 'Email delivery failed.' };
  }
}
