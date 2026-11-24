export function reportClientError(error, context) {
  if (error?.digest || error?.errorId) return error.digest || error.errorId;

  const errorId = globalThis.crypto?.randomUUID?.();
  if (!errorId || typeof window === 'undefined') return null;

  const payload = {
    errorId,
    context: String(context || 'client.runtime').slice(0, 80),
    name: String(error?.name || 'Error').slice(0, 80),
    message: String(error?.message || error || 'Unknown client error').slice(0, 2000),
    stack: String(error?.stack || '').slice(0, 6000),
  };

  try {
    void fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Error reporting must never interrupt the user's recovery flow.
  }

  return errorId;
}
