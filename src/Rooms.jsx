import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, RefreshCw, Search, Users, Wifi } from 'lucide-react';
import { api } from './api.js';
import { createGameSocket } from './realtime.js';

export default function Rooms({ onBack, onJoin, selectedGame }) {
  const [view, setView] = useState('home');
  const [capacity, setCapacity] = useState(5);
  const [roomName, setRoomName] = useState(selectedGame === 'uno' ? 'Phòng UNO' : 'Phòng Mèo Nổ');
  const [privateRoom, setPrivateRoom] = useState(false);
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [liveRooms, setLiveRooms] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  async function refreshRooms(showSpinner = false) {
    if (showSpinner) setLoadingList(true);
    try {
      const result = await api.listRooms(selectedGame);
      setLiveRooms(result.rooms);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      if (showSpinner) setLoadingList(false);
    }
  }

  useEffect(() => {
    if (view !== 'find') return undefined;
    setLoadingList(true);
    const socket = createGameSocket();
    const onRooms = ({ rooms }) => { setLiveRooms(rooms); setMessage(''); setLoadingList(false); };
    socket.on('connect', () => socket.emit('rooms:watch', { gameType: selectedGame }));
    socket.on('rooms:list', onRooms);
    socket.on('connect_error', (error) => { setMessage(error.message === 'AUTH_REQUIRED' ? 'Phiên đăng nhập hết hạn. Hãy đăng nhập lại.' : 'Không thể kết nối realtime. Thử nút làm mới để tải danh sách.'); setLoadingList(false); });
    socket.connect();
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, [view, selectedGame]);

  async function createRoom(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await api.createRoom({ gameType: selectedGame, name: roomName.trim(), capacity, visibility: privateRoom ? 'private' : 'public', password: privateRoom ? password : '' });
      setCreatedRoom(result.room);
      setView('created');
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  async function quickJoin() {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.quickJoin(selectedGame);
      onJoin(result.room);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  async function joinByCode(code, roomPassword) {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.joinRoom(code, roomPassword, selectedGame);
      onJoin(result.room);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  async function joinListedRoom(room) {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.joinRoom(room.code, '', selectedGame);
      onJoin(result.room);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(createdRoom.code);
      setMessage('Đã sao chép mã phòng.');
    } catch { setMessage('Không sao chép được. Hãy bôi đen mã phòng để sao chép thủ công.'); }
  }

  const rooms = liveRooms.filter((room) => `${room.name} ${room.host} ${room.code}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));

  return (
    <section className="rooms-page">
      <header className="rooms-top">
        <button className="back-link" onClick={view === 'home' ? onBack : () => { setView('home'); setMessage(''); }}><ArrowLeft size={17} />{view === 'home' ? 'Chọn game' : 'Quay lại'}</button>
        <div className="rooms-brand"><i>{selectedGame === 'uno' ? '🔥' : '✨'}</i><span>{selectedGame === 'uno' ? 'UNO' : 'MÈO NỔ'}<small>PHÒNG CHƠI</small></span></div>
        <span className="online-pill"><i />Phòng online</span>
      </header>
      <main className="rooms-main">
        {view === 'home' && <RoomOptions onCreate={() => { setMessage(''); setView('create'); }} onFind={() => { setMessage(''); setView('find'); }} onQuickJoin={quickJoin} loading={loading} message={message} />}
        {view === 'create' && <CreateRoomForm capacity={capacity} setCapacity={setCapacity} roomName={roomName} setRoomName={setRoomName} privateRoom={privateRoom} setPrivateRoom={setPrivateRoom} password={password} setPassword={setPassword} onSubmit={createRoom} loading={loading} message={message} selectedGame={selectedGame} />}
        {view === 'created' && createdRoom && <CreatedRoom room={createdRoom} message={message} onCopy={copyRoomCode} onJoin={() => onJoin(createdRoom)} />}
        {view === 'find' && <FindRoomList rooms={rooms} query={query} setQuery={setQuery} onJoin={joinListedRoom} onJoinByCode={joinByCode} loading={loading} loadingList={loadingList} message={message} onRefresh={() => refreshRooms(true)} selectedGame={selectedGame} />}
      </main>
    </section>
  );
}

function RoomOptions({ onCreate, onFind, onQuickJoin, loading, message, selectedGame }) {
  return <>
    <div className="rooms-intro"><label className="kicker">CHỌN CÁCH CHƠI</label><h1>Sẵn sàng vào bàn?</h1><p>Tạo phòng riêng, tìm bàn chơi hoặc vào nhanh phòng còn chỗ.</p></div>
    <div className="room-options">
      <Option icon={<Plus />} title="Tạo phòng" text="Chọn số người và thiết lập bàn chơi." onClick={onCreate} />
      <Option icon={<Search />} title="Tìm phòng" text={`Xem các phòng ${selectedGame === 'uno' ? 'UNO' : 'Mèo Nổ'} đang chờ người chơi.`} onClick={onFind} tone="blue" />
      <Option icon={<RefreshCw />} title="Vào ngay" text={loading ? 'Đang tìm phòng trống…' : 'Vào ngẫu nhiên một phòng công khai còn chỗ.'} onClick={onQuickJoin} tone="gold" disabled={loading} />
    </div>
  </>;
}

function Option({ icon, title, text, onClick, tone = '', disabled = false }) {
  return <button className="room-option" onClick={onClick} disabled={disabled}><span className={`option-icon ${tone ? `${tone}-icon` : ''}`}>{icon}</span><b>{title}</b><small>{text}</small><ArrowRight className="option-arrow" /></button>;
}

function CreateRoomForm({ capacity, setCapacity, roomName, setRoomName, privateRoom, setPrivateRoom, password, setPassword, onSubmit, loading, message, selectedGame }) {
  return <>
    <div className="rooms-intro"><label className="kicker">THIẾT LẬP PHÒNG</label><h1>Tạo phòng mới</h1><p>Chọn số chỗ tối đa. Mã phòng sẽ tạo sau khi mở phòng.</p></div>
    <form className="room-form" onSubmit={onSubmit}>
      <label>Tên phòng<input value={roomName} onChange={(event) => setRoomName(event.target.value)} minLength={2} maxLength={40} required /></label>
      <label>Số người chơi<div className="capacity-control"><button type="button" onClick={() => setCapacity(Math.max(selectedGame === 'uno' ? 2 : 3, Number(capacity) - 1))} aria-label="Giảm số người">−</button><strong>{capacity}<small> người</small></strong><button type="button" onClick={() => setCapacity(Math.min(10, Number(capacity) + 1))} aria-label="Tăng số người">+</button></div><small className="field-hint">Từ {selectedGame === 'uno' ? 2 : 3} đến 10 người</small></label>
      <label className="toggle-row"><span><b>Phòng riêng</b><small>Không hiện trong danh sách; bạn bè vào bằng mã và mật khẩu.</small></span><input type="checkbox" checked={privateRoom} onChange={(event) => setPrivateRoom(event.target.checked)} /></label>
      {privateRoom && <label>Mật khẩu phòng<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tạo mật khẩu phòng" maxLength={32} required /></label>}
      {message && <div className="inline-error" role="alert">{message}</div>}
      <div className="form-summary"><Users size={16} /> Bạn sẽ giữ ghế đầu tiên trong phòng.</div>
      <button className="primary room-submit" type="submit" disabled={loading}>{loading ? 'Đang tạo phòng…' : 'Tạo phòng'} <ArrowRight size={17} /></button>
    </form>
  </>;
}

function CreatedRoom({ room, message, onCopy, onJoin }) {
  return <div className="created-card"><span className="success-mark">✓</span><label className="kicker">PHÒNG ĐÃ SẴN SÀNG</label><h1>{room.name}</h1><p>Chia sẻ mã này để bạn bè vào phòng.</p><div className="code-box"><small>MÃ PHÒNG</small><strong>{room.code}</strong><span>{room.max} chỗ • Phòng {room.visibility === 'private' ? 'riêng' : 'công khai'}</span></div><div className="created-actions"><button className="secondary" onClick={onCopy}>Sao chép mã</button><button className="primary" onClick={onJoin}>Vào phòng chờ <ArrowRight size={16} /></button></div>{message && <small className="copy-note" role="status">{message}</small>}</div>;
}

function FindRoomList({ rooms, query, setQuery, onJoin, onJoinByCode, loading, loadingList, message, onRefresh, selectedGame }) {
  const [roomCode, setRoomCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  function submitCode(event) { event.preventDefault(); onJoinByCode(roomCode.trim().toUpperCase(), roomPassword); }

  return <>
    <div className="rooms-intro find-intro"><label className="kicker">{`PHÒNG ${selectedGame === 'uno' ? 'UNO' : 'MÈO NỔ'} ĐANG MỞ`}</label><h1>Tìm bàn chơi</h1><p>Chọn phòng công khai đang chờ và còn chỗ, hoặc nhập mã phòng riêng.</p></div>
    <form className="join-by-code" onSubmit={submitCode}><input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder={`Mã phòng, ví dụ ${selectedGame === 'uno' ? 'UNO-1234' : 'MEO-1234'}`} required maxLength={8} aria-label="Mã phòng" /><input type="password" value={roomPassword} onChange={(event) => setRoomPassword(event.target.value)} placeholder="Mật khẩu nếu là phòng riêng" aria-label="Mật khẩu phòng" /><button className="primary" disabled={loading}>{loading ? 'Đang vào…' : 'Vào bằng mã'}</button></form>
    <div className="room-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, chủ phòng hoặc mã" aria-label="Tìm phòng" /><button onClick={onRefresh} disabled={loadingList} aria-label="Làm mới danh sách"><RefreshCw size={15} /></button></div>
    {message && <div className="inline-error" role="alert">{message}</div>}
    <div className="room-list">
      {rooms.map((room, index) => { const full = room.players >= room.max; return <article className="room-row" key={room.code}><span className={`room-avatar av${index % 6}`}>{selectedGame === 'uno' ? '🔥' : '✨'}</span><div className="room-row-info"><b>{room.name}</b><small>Chủ phòng: {room.host}　•　{room.code}</small></div><div className="room-count"><Users size={14} />{room.players}/{room.max}</div><button className="join-btn" disabled={full || loading} onClick={() => onJoin(room)}>{full ? 'Đã đầy' : loading ? 'Đang vào…' : 'Vào phòng'}</button></article>; })}
      {!rooms.length && <div className="empty-rooms">{loadingList ? 'Đang tải phòng…' : query ? 'Không tìm thấy phòng phù hợp.' : 'Chưa có phòng công khai còn chỗ.'}</div>}
    </div>
    <div className="find-bottom"><span><i /> Danh sách cập nhật trực tiếp</span><button onClick={onRefresh} disabled={loadingList}><RefreshCw size={14} /> {loadingList ? 'Đang tải…' : 'Làm mới'}</button></div>
  </>;
}



