/**
 * Sends an email notification via Resend. Requires RESEND_API_KEY.
 * Without it, silently no-ops (logs to console) rather than throwing.
 */
export async function sendEmailNotification({ to, subject, body }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.NOTIFICATIONS_FROM_EMAIL || 'NPC <notifications@npc.ng>';

  if (!apiKey) {
    console.log(`[email skipped — no RESEND_API_KEY] would send "${subject}" to ${to}`);
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
      console.error('Resend email failed:', errText);
      return { skipped: true, error: errText };
    }
    return { skipped: false };
  } catch (err) {
    console.error('Resend email error:', err.message);
    return { skipped: true, error: err.message };
  }
}
