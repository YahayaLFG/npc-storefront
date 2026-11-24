import { reportClientError } from './report-client-error';

export function userFacingError(error, fallback = 'Something went wrong. Please try again.') {
  if (process.env.NODE_ENV !== 'production' && error instanceof Error && error.message) {
    return error.message;
  }

  const errorId = error?.errorId || error?.digest;
  if (errorId) return `${fallback} Reference ID: ${errorId}`;

  if (error?.message && /Reference ID:\s*[\da-f-]{16,}/i.test(error.message)) {
    return error.message;
  }

  return fallback;
}

export function captureUserFacingError(error, context, fallback = 'Something went wrong. Please try again.') {
  const errorId = reportClientError(error, context);
  if (process.env.NODE_ENV !== 'production' && error instanceof Error && error.message) {
    return error.message;
  }
  return errorId ? `${fallback} Reference ID: ${errorId}` : userFacingError(error, fallback);
}
