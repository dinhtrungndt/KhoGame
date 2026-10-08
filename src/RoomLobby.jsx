import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, DoorOpen, Maximize2, Minimize2, Play, Users, Wifi } from 'lucide-react';
import { createGameSocket } from './realtime.js';
import { playSfx } from './audio.js';
import RoomChat from './RoomChat.jsx';

export default function RoomLobby({ room, onLeave, onStartGame, sound = true }) {
  const [state, setState] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [socket, setSocket] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const soundRef = useRef(sound);
  const stateRef = useRef(null);
  soundRef.current = sound;
  const players = state?.players ?? [];
  const me = players.find((player) => player.userId === userId);
  const isHost = me?.isHost ?? false;
  const canStart = Boolean(state?.canStart && isHost);
  const openSeats = useMemo(() => Math.max(0, (state?.room?.max ?? room.max ?? 5) - players.length), [players.length, room.max, state?.room?.max]);

  useEffect(() => {
    const connection = createGameSocket();
    setSocket(connection);
    connection.on('connect', () => connection.emit('room:join', { code: room.code }, (result) => {
      setLoading(false);
      if (!result?.ok) setError(result?.error || 'Không thể vào phòng realtime.');
    }));
    connection.on('room:state', (next) => {
      if (stateRef.current && next.players?.length !== stateRef.current.players?.length) playSfx('enter', soundRef.current);
      stateRef.current = next;
      setState(next); setLoading(false); setError('');
    });
    connection.on('room:you', ({ userId: currentId }) => setUserId(currentId));
    connection.on('game:started', () => { playSfx('start', soundRef.current); onStartGame?.(); });
    connection.on('room:closed', () => setError('Chủ phòng đã đóng phòng.'));
    connection.on('connect_error', (reason) => { setLoading(false); setError(reason.message === 'AUTH_REQUIRED' ? 'Phiên đăng nhập đã hết hạn.' : 'Mất kết nối với máy chủ realtime.'); });
    connection.connect();
    return () => { connection.removeAllListeners(); connection.disconnect(); };
  }, [room.code, onStartGame]);

  async function copyCode() {
    try { await navigator.clipboard.writeText(room.code); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
    catch { setError('Không sao chép được mã phòng.'); }
  }

  function toggleReady() {
    if (!socket?.connected || !me) return;
    setError('');
    socket.emit('room:ready', { code: room.code, ready: !me.ready }, (result) => { if (!result?.ok) setError(result?.error || 'Không đổi được trạng thái sẵn sàng.'); });
  }

  function startGame() {
    if (!canStart || !socket?.connected) return;
    setError('');
    socket.emit('game:start', { code: room.code }, (result) => { if (!result?.ok) setError(result?.error || 'Không thể bắt đầu ván.'); });
  }

  async function exitRoom() {
    setLeaving(true);
    try { await onLeave(); } catch (requestError) { setError(requestError.message); setLeaving(false); }
  }

  return (
    <section className={`rooms-page waiting-page ${expanded ? 'is-expanded' : ''}`}>
      <header className="rooms-top">
        <button className="back-link" onClick={exitRoom} disabled={leaving}><ArrowLeft size={17} />{leaving ? 'Đang rời phòng…' : 'Rời phòng'}</button>
        <div className="rooms-brand"><i>✦</i><span>MÈO NỔ<small>BÀN CHỜ</small></span></div>
        <div className="waiting-top-actions">
          <button className="expand-button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Thu nhỏ bàn chơi' : 'Phóng to bàn chơi'} title={expanded ? 'Thu nhỏ bàn chơi' : 'Phóng to bàn chơi'}>
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <span className="online-pill"><i />{socket?.connected ? 'Realtime' : 'Đang kết nối'}</span>
        </div>
      </header>
      <main className="room-table-page">
        <div className="room-table-heading"><div><label className="kicker">PHÒNG {room.code}</label><h1>{state?.room?.name ?? room.name}</h1></div><button className="secondary" onClick={copyCode}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Đã sao chép' : 'Mời bạn'}</button></div>
        <section className="felt waiting-felt" aria-label="Bàn chờ Mèo Nổ">
          <div className="waiting-felt-text"><span className="felt-spark">✦</span><strong>{players.length < 3 ? 'Đang chờ thêm người chơi' : state?.canStart ? 'Bàn đã sẵn sàng!' : 'Chờ mọi người sẵn sàng'}</strong><small><Users size={14} /> {players.length}/{state?.room?.max ?? room.max} người　·　Cần tối thiểu 3 người</small>
            {isHost ? <button className={`table-start ${canStart ? 'ready-to-start' : ''}`} onClick={startGame} disabled={!canStart || loading}><Play size={18} fill="currentColor" /> BẮT ĐẦU VÁN</button> : <span className="host-wait">Chủ phòng sẽ bắt đầu khi mọi người sẵn sàng</span>}
          </div>
          {Array.from({ length: Math.min(10, state?.room?.max ?? room.max ?? 5) }, (_, index) => {
            const player = players.find((item) => item.seat === index + 1);
            const angle = (Math.PI * 2 * index) / Math.min(10, state?.room?.max ?? room.max ?? 5) - Math.PI / 2;
            const radiusX = 42; const radiusY = 39;
            return <article key={index} className={`lobby-player-seat ${player ? 'is-filled' : ''} ${player?.userId === userId ? 'is-you' : ''}`} style={{ left: `${50 + Math.cos(angle) * radiusX}%`, top: `${50 + Math.sin(angle) * radiusY}%` }}>
              <span className={`lobby-avatar av${index % 6}`}>{player ? player.username.slice(0, 1).toLocaleUpperCase() : '+'}</span><b>{player?.username ?? 'Ghế trống'}</b><small>{player?.isHost ? 'Chủ phòng' : player?.userId === userId ? 'Bạn' : player ? 'Người chơi' : 'Đang chờ'}</small>{player && <em className={player.ready ? 'seat-ready' : ''}>{player.ready ? 'SẴN SÀNG' : 'CHƯA SẴN SÀNG'}</em>}
            </article>;
          })}
          <span className="table-room-count"><Wifi size={14} /> {openSeats ? `Còn ${openSeats} ghế trống` : 'Đã đủ người'}</span>
        </section>
        <div className="room-table-actions">
          {error && <div className="inline-error" role="alert">{error}</div>}
          <div className="ready-summary"><Users size={17} /><b>{loading ? 'Đang kết nối bàn chơi…' : `${state?.readyCount ?? 0}/${players.length} người đã sẵn sàng`}</b><span>Trạng thái được đồng bộ tức thì</span></div>
          <button className={`primary ready-toggle ${me?.ready ? 'is-ready' : ''}`} onClick={toggleReady} disabled={!me || loading || !socket?.connected}><Check size={18} />{me?.ready ? 'BỎ SẴN SÀNG' : 'TÔI ĐÃ SẴN SÀNG'}</button>
          <button className="secondary leave-table" onClick={exitRoom} disabled={leaving}><DoorOpen size={16} /> Rời bàn</button>
        </div>
        {socket?.connected && userId && (
          <RoomChat socket={socket} roomCode={room.code} userId={userId} />
        )}
      </main>
    </section>
  );
}
