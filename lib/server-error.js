import 'server-only';

import { randomUUID } from 'node:crypto';

function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error
        ? { name: error.cause.name, message: error.cause.message, stack: error.cause.stack }
        : error.cause,
      code: error.code,
    };
  }

  return error;
}

export function logServerError(context, error, requestedErrorId) {
  const errorId = typeof requestedErrorId === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(requestedErrorId)
    ? requestedErrorId
    : randomUUID();
  const entry = {
    level: 'error',
    event: 'server_error',
    errorId,
    context,
    timestamp: new Date().toISOString(),
    error: serializeError(error),
  };
  try {
    console.error(JSON.stringify(entry));
  } catch {
    console.error(JSON.stringify({ ...entry, error: String(error) }));
  }
  return errorId;
}

export function publicError(context, error) {
  const errorId = logServerError(context, error);
  const visibleMessage = process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again.'
    : error instanceof Error ? error.message : String(error);
  return {
    error: `${visibleMessage} Reference ID: ${errorId}`,
    errorId,
  };
}

export function publicServerException(context, error) {
  const errorId = logServerError(context, error);
  const message = process.env.NODE_ENV === 'production'
    ? `Something went wrong. Reference ID: ${errorId}`
    : error instanceof Error ? error.message : String(error);
  const safeError = new Error(message);
  safeError.digest = errorId;
  return safeError;
}
