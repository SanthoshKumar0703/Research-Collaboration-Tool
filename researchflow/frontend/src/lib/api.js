/* ResearchFlow dual-mode API client.
 *
 * When VITE_API_URL is not set, the app runs in self-contained DEMO mode
 * (mock data, no network). When it is set, every action below talks to the
 * FastAPI backend and the same UI components render real server data.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const TOKEN_KEY = 'rf_token';

export const hasApi = () => !!API_BASE;
export const API = API_BASE;

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
};
export const clearToken = () => setToken(null);

/** API mode requires a configured backend AND an authenticated user. */
export const apiMode = () => hasApi() && !!getToken();

/** Absolute URL for API-served assets (avatars, document downloads). */
export const absUrl = (path) => (path && API_BASE ? API_BASE + path : path);

/** WebSocket base for the project chat socket. */
export const wsUrl = (path) => {
  if (!API_BASE) return null;
  const u = new URL(API_BASE);
  const proto = u.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${u.host}${path}`;
};

export class ApiError extends Error {
  constructor(msg, status, data) {
    super(msg);
    this.status = status;
    this.data = data;
  }
}

const detail = (d, status) => {
  if (typeof d?.detail === 'string') return d.detail;
  if (Array.isArray(d?.detail)) return d.detail.map((x) => x.msg).join(' · ');
  return d?.message || `Request failed (${status})`;
};

/**
 * fetch wrapper: JSON in/out, Bearer auth, 401 → back to /login.
 * `form` sends FormData (file uploads); `raw` returns the Response.
 */
export async function api(path, { method = 'GET', body, form, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: payload });
  } catch {
    throw new ApiError('Cannot reach the ResearchFlow API. Is the backend running?', 0, null);
  }
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    clearToken();
    if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    throw new ApiError('Session expired — please sign in again.', 401, null);
  }
  if (raw) {
    if (!res.ok) throw new ApiError(await detail(await res.json().catch(() => null), res.status), res.status, null);
    return res;
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiError(detail(data, res.status), res.status, data);
  return data;
}
