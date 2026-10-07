import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, RefreshCw, Search, Users, Wifi } from 'lucide-react';
import { api } from './api.js';

export default function Rooms({ onBack, onJoin }) {
  const [view, setView] = useState('home');
  const [capacity, setCapacity] = useState(5);
  const [roomName, setRoomName] = useState('Phòng Mèo Nổ');
  const [privateRoom, setPrivateRoom] = useState(false);
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [liveRooms, setLiveRooms] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (view !== 'find') return undefined;
    let mounted = true;
    async function refreshRooms() {
      try {
        const result = await api.listRooms('meono');
        if (mounted) { setLiveRooms(result.rooms); setMessage(''); }
      } catch (error) {
        if (mounted) setMessage(error.message);
      }
    }
    refreshRooms();
    const timer = window.setInterval(refreshRooms, 5000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [view]);

  async function createRoom(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await api.createRoom({
        gameType: 'meono', name: roomName, capacity,
        visibility: privateRoom ? 'private' : 'public', password: privateRoom ? password : '',
      });
      setCreatedRoom(result.room);
      setView('created');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickJoin() {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.quickJoin('meono');
      onJoin(result.room);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinByCode(code, roomPassword) {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.joinRoom(code, roomPassword);
      onJoin(result.room);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  async function joinRoom(room) {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.joinRoom(room.code);
      onJoin(result.room);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const rooms = liveRooms.filter((room) =>
    `${room.name} ${room.host} ${room.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className="rooms-page">
      <header className="rooms-top">
        <button className="back-link" onClick={view === 'home' ? onBack : () => { setView('home'); setMessage(''); }}>
          <ArrowLeft size={17} />{view === 'home' ? 'Chọn game' : 'Quay lại'}
        </button>
        <div className="rooms-brand"><i>✦</i><span>MÈO NỔ<small>PHÒNG CHƠI</small></span></div>
        <span className="online-pill"><i />Phòng online</span>
      </header>
      <main className="rooms-main">
        {view === 'home' && <RoomOptions onCreate={() => setView('create')} onFind={() => setView('find')} onQuickJoin={quickJoin} loading={loading} message={message} />}
        {view === 'create' && <CreateRoomForm capacity={capacity} setCapacity={setCapacity} roomName={roomName} setRoomName={setRoomName} privateRoom={privateRoom} setPrivateRoom={setPrivateRoom} password={password} setPassword={setPassword} onSubmit={createRoom} loading={loading} message={message} />}
        {view === 'created' && createdRoom && <CreatedRoom room={createdRoom} message={message} onCopy={() => { navigator.clipboard?.writeText(createdRoom.code); setMessage('Đã sao chép mã phòng.'); }} onJoin={() => onJoin(createdRoom)} />}
        {view === 'find' && <FindRoomList rooms={rooms} query={query} setQuery={setQuery} onJoin={joinRoom} onJoinByCode={joinByCode} loading={loading} message={message} onRefresh={() => api.listRooms('meono').then((result) => setLiveRooms(result.rooms)).catch((error) => setMessage(error.message))} />}
      </main>
    </section>
  );
}

function RoomOptions({ onCreate, onFind, onQuickJoin, loading, message }) {
  return (
    <>
      <div className="rooms-intro"><label className="kicker">CHỌN CÁCH CHƠI</label><h1>Sẵn sàng vào bàn?</h1><p>Tạo phòng riêng, tìm bạn chơi hoặc vào nhanh phòng còn chỗ.</p></div>
      <div className="room-options">
        <Option icon={<Plus />} title="Tạo phòng" text="Chọn số người và thiết lập bàn chơi." onClick={onCreate} />
        <Option icon={<Search />} title="Tìm phòng" text="Xem các phòng đang chờ người chơi." onClick={onFind} tone="blue" />
        <Option icon={<RefreshCw />} title="Vào ngay" text={loading ? 'Đang tìm phòng trống…' : 'Chọn ngẫu nhiên một phòng còn chỗ.'} onClick={onQuickJoin} tone="gold" disabled={loading} />
      </div>
      <div className="room-info"><Wifi size={15} /> Danh sách phòng được tải từ máy chủ.</div>
      {message && <div className="inline-error">{message}</div>}
    </>
  );
}

function Option({ icon, title, text, onClick, tone = '', disabled = false }) {
  return (
    <button className="room-option" onClick={onClick} disabled={disabled}>
      <span className={`option-icon ${tone ? `${tone}-icon` : ''}`}>{icon}</span>
      <b>{title}</b><small>{text}</small><ArrowRight className="option-arrow" />
    </button>
  );
}

function CreateRoomForm({ capacity, setCapacity, roomName, setRoomName, privateRoom, setPrivateRoom, password, setPassword, onSubmit, loading, message }) {
  return (
    <>
      <div className="rooms-intro"><label className="kicker">THIẾT LẬP PHÒNG</label><h1>Tạo phòng mới</h1><p>Chọn số chỗ tối đa. Mã phòng tạo khi mở phòng.</p></div>
      <form className="room-form" onSubmit={onSubmit}>
        <label>Tên phòng<input value={roomName} onChange={(event) => setRoomName(event.target.value)} maxLength={40} required /></label>
        <label>Số người chơi
          <div className="capacity-control">
            <button type="button" onClick={() => setCapacity(Math.max(3, Number(capacity) - 1))}>−</button>
            <strong>{capacity}<small> người</small></strong>
            <button type="button" onClick={() => setCapacity(Math.min(10, Number(capacity) + 1))}>+</button>
          </div>
          <small className="field-hint">Từ 3 đến 10 người</small>
        </label>
        <label className="toggle-row"><span><b>Phòng riêng</b><small>Chỉ người có mã phòng mới vào được.</small></span><input type="checkbox" checked={privateRoom} onChange={(event) => setPrivateRoom(event.target.checked)} /></label>
        {privateRoom && <label>Mật khẩu phòng<input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu phòng" maxLength={32} required /></label>}
        {message && <div className="inline-error">{message}</div>}
        <div className="form-summary"><Users size={16} /> Mã phòng được tạo tự động sau khi mở.</div>
        <button className="primary room-submit" type="submit" disabled={loading}>{loading ? 'Đang tạo phòng…' : 'Tạo phòng'} <ArrowRight size={17} /></button>
      </form>
    </>
  );
}

function CreatedRoom({ room, message, onCopy, onJoin }) {
  return (
    <div className="created-card">
      <span className="success-mark">✓</span><label className="kicker">PHÒNG ĐÃ SẴN SÀNG</label>
      <h1>{room.name}</h1><p>Chia sẻ mã này để bạn bè vào phòng.</p>
      <div className="code-box"><small>MÃ PHÒNG</small><strong>{room.code}</strong><span>{room.max} chỗ • {room.visibility === 'private' ? 'Phòng riêng' : 'Phòng công khai'}</span></div>
      <div className="created-actions"><button className="secondary" onClick={onCopy}>Sao chép mã</button><button className="primary" onClick={onJoin}>Vào phòng chờ <ArrowRight size={16} /></button></div>
      {message && <small className="copy-note">{message}</small>}
    </div>
  );
}

function FindRoomList({ rooms, query, setQuery, onJoin, onJoinByCode, loading, message, onRefresh }) {
  const [roomCode, setRoomCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  function submitCode(event) {
    event.preventDefault();
    onJoinByCode(roomCode.trim(), roomPassword);
  }

  return (
    <>
      <div className="rooms-intro find-intro"><label className="kicker">PHÒNG ĐANG MỞ</label><h1>Tìm bàn chơi</h1><p>Chọn phòng đang chờ và còn chỗ.</p></div>
      <form className="join-by-code" onSubmit={submitCode}><input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="Nhập mã phòng, ví dụ MEO-1234" required /><input type="password" value={roomPassword} onChange={(event) => setRoomPassword(event.target.value)} placeholder="Mật khẩu nếu là phòng riêng" /><button className="primary" disabled={loading}>Vào bằng mã</button></form>
      <div className="room-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, chủ phòng hoặc mã" /><button onClick={onRefresh} aria-label="Làm mới"><RefreshCw size={15} /></button></div>
      {message && <div className="inline-error">{message}</div>}
      <div className="room-list">
        {rooms.map((room, index) => {
          const full = room.players >= room.max;
          return (
            <article className="room-row" key={room.code}>
              <span className={`room-avatar av${index % 6}`}>✦</span>
              <div className="room-row-info"><b>{room.name}</b><small>Chủ phòng: {room.host}　•　{room.code}</small></div>
              <div className="room-count"><Users size={14} />{room.players}/{room.max}</div>
              <button className="join-btn" disabled={full || loading} onClick={() => onJoin(room)}>{full ? 'Đã đầy' : loading ? 'Đang vào…' : 'Vào phòng'}</button>
            </article>
          );
        })}
        {!rooms.length && <div className="empty-rooms">{loading ? 'Đang tải phòng…' : 'Chưa có phòng công khai còn chỗ.'}</div>}
      </div>
      <div className="find-bottom"><span><i /> Tự cập nhật mỗi 5 giây</span><button onClick={onRefresh}><RefreshCw size={14} /> Làm mới</button></div>
    </>
  );
}
