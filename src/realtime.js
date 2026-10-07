import { io } from 'socket.io-client';

const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

export function createGameSocket() {
  return io(apiBase, { withCredentials: true, autoConnect: false, transports: ['websocket'] });
}
