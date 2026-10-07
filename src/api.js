const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Không thể kết nối máy chủ.');
    error.code = payload.error?.code;
    error.status = response.status;
    throw error;
  }
  return payload;
}

const json = (value) => ({ method: 'POST', body: JSON.stringify(value) });

export const api = {
  login: (body) => request('/auth/login', json(body)),
  register: (body) => request('/auth/register', json(body)),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password', json({ email })),
  resetPassword: (token, password) => request('/auth/reset-password', json({ token, password })),
  listRooms: (gameType = 'meono') => request(`/rooms?game=${encodeURIComponent(gameType)}`),
  createRoom: (body) => request('/rooms', json(body)),
  quickJoin: (gameType = 'meono') => request('/rooms/quick-join', json({ gameType })),
  joinRoom: (code, password = '') => request(`/rooms/${encodeURIComponent(code)}/join`, json({ password })),
};
