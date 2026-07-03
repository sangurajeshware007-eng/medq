/**
 * Pulls a user-facing message out of an Axios error.
 *
 * The backend wraps every error in:
 *   { success: false, error: { code, message, details } }
 *
 * Older callers were reading `response.data.message`, which doesn't exist —
 * they always fell through to the generic fallback. This helper reads the
 * correct path and degrades gracefully through axios's network/timeout cases.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
    code?: string;
  };

  // Standard envelope shape from backend
  if (e?.response?.data?.error?.message) return e.response.data.error.message;

  // Some endpoints (or older code) put it at .data.message directly
  if (e?.response?.data?.message) return e.response.data.message;

  // Network failures (no response)
  if (e?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and try again.';
  if (e?.message === 'Network Error') return 'Network error — please check your internet connection.';

  if (e?.message) return e.message;
  return fallback;
}

/** Extract the error code from the standard envelope, if present. */
export function getApiErrorCode(err: unknown): string | undefined {
  return (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
}
