export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message || 'API request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code || 'API_ERROR';
    this.details = error.details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With', 'XMLHttpRequest');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send first-party session cookies
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorPayload: ApiErrorPayload = payload?.error || {
      code: 'HTTP_ERROR',
      message: response.statusText || 'Request failed',
    };
    throw new ApiError(response.status, errorPayload);
  }

  return payload as { data: T; meta?: Record<string, unknown> };
}
