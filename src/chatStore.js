export const chatMessages = [];
const listeners = new Set();

export function subscribeChat(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addChatMessage(msg) {
  chatMessages.push(msg);
  if (chatMessages.length > 200) chatMessages.shift();
  listeners.forEach(l => l([...chatMessages]));
}

export function clearChatMessages() {
  chatMessages.length = 0;
  listeners.forEach(l => l([]));
}
