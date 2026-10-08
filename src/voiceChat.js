import { createGameSocket } from './realtime.js';

let localStream = null;
let peers = {}; // userId -> RTCPeerConnection
let socket = null;
let currentUserId = null;
let currentRoomCode = null;
let listeners = new Set();

export function subscribeVoice(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach(l => l({ active: !!localStream, peers: Object.keys(peers) }));
}

export function initVoiceReceiver(roomCode, userId) {
  currentUserId = userId;
  currentRoomCode = roomCode;
  setupSocket();
}

export async function toggleMic(roomCode, userId) {
  if (localStream) {
    // Disable mic but keep receiving
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    
    // Replace track with nothing in all peers
    Object.values(peers).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
      if (sender) pc.removeTrack(sender);
    });
    notify();
    return;
  }
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    currentUserId = userId;
    currentRoomCode = roomCode;
    setupSocket();
    
    // Add track to existing peers
    Object.values(peers).forEach(pc => {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    });
    notify();
  } catch (err) {
    console.error("Mic error:", err);
    alert("Không thể truy cập microphone.");
  }
}

export function stopMic() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  Object.values(peers).forEach(pc => pc.close());
  peers = {};
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  notify();
}

function setupSocket() {
  if (socket) return;
  socket = createGameSocket();
  socket.on('connect', () => {
    socket.emit('room:join', { code: currentRoomCode });
  });
  
  // When a new person joins, they will also set up their socket and we can exchange offers via webrtc:signal.
  // Actually, we need to know who is in the room. A simpler way is to broadcast an offer to everyone when we join,
  // but socket.io doesn't broadcast 'room:you' to others.
  // For simplicity, we can listen to room:state to get player list and initiate connections to everyone else.
  socket.on('room:state', (state) => {
    const others = state.players.filter(p => p.userId !== currentUserId);
    others.forEach(p => {
      if (!peers[p.userId] && p.userId > currentUserId) {
        initiateConnection(p.userId);
      }
    });
  });

  socket.on('webrtc:signal', async ({ sourceUserId, signal }) => {
    let pc = peers[sourceUserId];
    if (!pc) {
      pc = createPeer(sourceUserId);
    }
    if (signal.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:signal', { code: currentRoomCode, targetUserId: sourceUserId, signal: answer });
    } else if (signal.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
    } else if (signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal));
    }
  });

  socket.connect();
}

function createPeer(targetUserId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  pc.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit('webrtc:signal', { code: currentRoomCode, targetUserId, signal: event.candidate });
    }
  };

  pc.ontrack = (event) => {
    const audio = new Audio();
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    audio.play().catch(e => console.error("Audio play error", e));
  };

  if (localStream) {
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  }

  peers[targetUserId] = pc;
  notify();
  return pc;
}

async function initiateConnection(targetUserId) {
  const pc = createPeer(targetUserId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  if (socket) {
    socket.emit('webrtc:signal', { code: currentRoomCode, targetUserId, signal: offer });
  }
}
