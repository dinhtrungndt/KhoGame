import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, MessageSquare, X } from 'lucide-react';
import { chatMessages, subscribeChat, addChatMessage } from './chatStore.js';
import { toggleMic, subscribeVoice, initVoiceReceiver } from './voiceChat.js';

export default function RoomChat({ socket, roomCode, userId }) {
  const [messages, setMessages] = useState(chatMessages);
  const [text, setText] = useState('');
  const [micActive, setMicActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    initVoiceReceiver(roomCode, userId);
    return subscribeChat((msgs) => setMessages(msgs));
  }, [roomCode, userId]);

  useEffect(() => {
    return subscribeVoice((state) => setMicActive(state.active));
  }, []);

  useEffect(() => {
    if (isChatOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (!socket) return;
    const onChat = (msg) => {
      addChatMessage(msg);
      // Optional: open chat or show indicator if new message arrives while closed
      if (msg.userId !== userId && !isChatOpen) {
        // You could add an unread badge state here if you want
      }
    };
    socket.on('room:chat:message', onChat);
    return () => socket.off('room:chat:message', onChat);
  }, [socket, isChatOpen, userId]);

  function sendChat(e) {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('room:chat', { code: roomCode, message: text });
    setText('');
  }

  return (
    <div className="room-communication">
      {isChatOpen && (
        <div className="room-chat-panel">
          <div className="chat-header">
            <strong>Trò chuyện</strong>
            <button className="close-chat" onClick={() => setIsChatOpen(false)}><X size={16} /></button>
          </div>
          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="chat-empty">Chưa có tin nhắn nào.</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.userId === userId ? 'self' : ''}`}>
                  <strong>{m.username}</strong>
                  <p>{m.message}</p>
                </div>
              ))
            )}
          </div>
          <form className="chat-input" onSubmit={sendChat}>
            <input 
              type="text" 
              placeholder="Nhập tin nhắn..." 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
            />
            <button type="submit" disabled={!text.trim()}><Send size={16} /></button>
          </form>
        </div>
      )}
      
      <div className="communication-actions">
        <button 
          className={`fab mic-fab ${micActive ? 'active' : ''}`} 
          onClick={() => toggleMic(roomCode, userId)}
          title={micActive ? 'Tắt Mic' : 'Bật Mic'}
        >
          {micActive ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button 
          className={`fab chat-fab ${isChatOpen ? 'active' : ''}`} 
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Trò chuyện"
        >
          <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
}
