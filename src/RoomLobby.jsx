import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, DoorOpen, RefreshCw, Users, Wifi } from 'lucide-react';
import { api } from './api.js';

export default function RoomLobby({ room, onLeave }) {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const result = await api.getRoom(room.code);
        if (active) { setCurrentRoom(result.room); setError(''); }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [room.code]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Không sao chép được mã phòng. Bạn có thể bôi đen để sao chép thủ công.');
    }
  }

  async function exitRoom() {
    setLeaving(true);
    try { await onLeave(); }
    catch (requestError) { setError(requestError.message); setLeaving(false); }
  }

  const players = currentRoom?.players ?? [];
  const capacity = currentRoom?.max ?? room.max ?? 5;
  const filledSeats = new Map(players.map((player) => [player.seat, player]));

  return (
    <section className="rooms-page waiting-page">
      <header className="rooms-top">
        <button className="back-link" onClick={exitRoom} disabled={leaving}><ArrowLeft size={17} />{leaving ? 'Đang rời phòng…' : 'Rời phòng'}</button>
        <div className="rooms-brand"><i>✦</i><span>MÈO NỔ<small>PHÒNG CHỜ</small></span></div>
        <span className="online-pill"><i />Đang cập nhật</span>
      </header>
      <main className="waiting-main">
        <div className="waiting-heading"><label className="kicker">PHÒNG ĐÃ SẴN SÀNG</label><h1>{currentRoom?.name ?? room.name}</h1><p>Chia sẻ mã phòng để bạn bè cùng tham gia.</p></div>
        <div className="waiting-code"><div><small>MÃ PHÒNG</small><strong>{room.code}</strong><span>{currentRoom?.visibility === 'private' || room.visibility === 'private' ? 'Phòng riêng' : 'Phòng công khai'}</span></div><button className="secondary" onClick={copyCode}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Đã sao chép' : 'Sao chép mã'}</button></div>
        <section className="waiting-players">
          <header><div><Users size={17} /><b>Người chơi</b><span>{loading ? 'Đang tải…' : `${players.length}/${capacity}`}</span></div><span className="live-dot"><i /> cập nhật mỗi 3 giây</span></header>
          {error && <div className="inline-error" role="status">{error}</div>}
          <div className="waiting-seat-grid">
            {Array.from({ length: capacity }, (_, index) => {
              const player = filledSeats.get(index + 1);
              return <article className={`waiting-seat ${player ? 'occupied' : ''}`} key={index}><span className={`seat-avatar av${index % 6}`}>{player ? player.username.slice(0, 1).toUpperCase() : '+'}</span><div><b>{player?.username ?? 'Đang chờ người chơi'}</b><small>{player ? player.isHost ? 'Chủ phòng' : `Người chơi ${player.seat}` : `Vị trí ${index + 1}`}</small></div>{player?.isHost && <span className="host-tag">CHỦ PHÒNG</span>}</article>;
            })}
          </div>
          {!players.length && !loading && <p className="empty-rooms">Không tải được danh sách người chơi.</p>}
        </section>
        <div className="waiting-footer"><span><Wifi size={15} /> Phòng lưu trên máy chủ</span><button className="secondary" onClick={exitRoom} disabled={leaving}><DoorOpen size={16} /> Rời phòng</button></div>
        <p className="waiting-note">Bàn chơi sẽ bắt đầu khi chức năng ván đấu được hoàn thiện.</p>
      </main>
    </section>
  );
}
