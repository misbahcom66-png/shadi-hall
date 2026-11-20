let cachedCsrfToken: string | null = null;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function ensureCsrfToken(): Promise<string> {
  const fromCookie = readCookie('csrf_token');
  if (fromCookie) {
    cachedCsrfToken = fromCookie;
    return fromCookie;
  }
  if (cachedCsrfToken) return cachedCsrfToken;
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  const data = await res.json();
  cachedCsrfToken = data.csrfToken;
  return data.csrfToken;
}

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = await ensureCsrfToken();
    headers.set('X-CSRF-Token', csrf);
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : `Request failed (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}
