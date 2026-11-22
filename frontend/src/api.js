// Small wrapper around the Fetch API:
//  - adds the access token to every request
//  - if the access token expired (401), it uses the refresh token once and retries
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const tokens = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set(access, refresh) {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh'];
let refreshing = null; // so parallel requests share one refresh call

async function refreshTokens() {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refresh }),
  });
  if (!res.ok) {
    tokens.clear();
    throw new Error('Session expired. Please log in again.');
  }
  const data = await res.json();
  tokens.set(data.accessToken, data.refreshToken);
}

export async function api(path, { method = 'GET', body } = {}, canRetry = true) {
  const cleanPath = path.startsWith('/api')
    ? path
    : `/api${path.startsWith('/') ? path : `/${path}`}`;
  const url = BASE.endsWith('/api')
    ? `${BASE}${cleanPath.replace(/^\/api/, '')}`
    : `${BASE}${cleanPath}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && canRetry && tokens.refresh && !NO_REFRESH.includes(path)) {
    refreshing = refreshing || refreshTokens().finally(() => { refreshing = null; });
    try {
      await refreshing;
    } catch (err) {
      window.dispatchEvent(new Event('auth:logout'));
      throw err;
    }
    return api(path, { method, body }, false);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// helper: { a: 1, b: '' } -> "?a=1"
export const qs = (params) => {
  const p = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== false));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');