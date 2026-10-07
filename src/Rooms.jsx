import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, RefreshCw, Search, Users, Wifi } from 'lucide-react';

const sampleRooms = [
  { name: 'Mèo quạo', host: 'MeowMeow', players: 4, max: 6, code: 'MEO-4821', state: 'Đang chờ' },
  { name: 'Hội cú đêm', host: 'linhnguyen', players: 7, max: 10, code: 'MEO-1058', state: 'Đang chơi' },
  { name: 'Chơi vui thôi', host: 'BapRang', players: 3, max: 5, code: 'MEO-9137', state: 'Đang chờ' },
  { name: 'Mèo nào nổ?', host: 'Khoa', players: 9, max: 10, code: 'MEO-6672', state: 'Đang chờ' },
  { name: 'Phòng của Miu', host: 'MiuMiu', players: 2, max: 4, code: 'MEO-2240', state: 'Đang chờ' },
  { name: 'Nhóm bạn thân', host: 'Annie', players: 5, max: 5, code: 'MEO-7304', state: 'Đã đầy' },
];

export default function Rooms({ onBack, onJoin }) {
  const [view, setView] = useState('home');
  const [capacity, setCapacity] = useState(5);
  const [roomName, setRoomName] = useState('Phòng Mèo Nổ');
  const [privateRoom, setPrivateRoom] = useState(false);
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [message, setMessage] = useState('');

  function createRoom(event) {
    event.preventDefault();
    setCreatedRoom({
      name: roomName || 'Phòng Mèo Nổ', host: 'Bạn', players: 1,
      max: Number(capacity), code: `MEO-${Math.floor(1000 + Math.random() * 9000)}`,
      state: 'Đang chờ', privateRoom, password,
    });
    setView('created');
  }

  function quickJoin() {
    const available = sampleRooms.filter((room) => room.players < room.max && room.state === 'Đang chờ');
    if (!available.length) {
      setMessage('Hiện chưa có phòng trống. Thử tạo phòng mới nhé.');
      return;
    }
    onJoin(available[Math.floor(Math.random() * available.length)]);
  }

  const rooms = sampleRooms.filter((room) =>
    `${room.name} ${room.host} ${room.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className="rooms-page">
      <header className="rooms-top">
        <button className="back-link" onClick={view === 'home' ? onBack : () => { setView('home'); setMessage(''); }}>
          <ArrowLeft size={17} />{view === 'home' ? 'Chọn game' : 'Quay lại'}
        </button>
        <div className="rooms-brand"><i>✦</i><span>MÈO NỔ<small>PHÒNG CHƠI</small></span></div>
        <span className="online-pill"><i />{sampleRooms.filter((room) => room.state === 'Đang chờ' && room.players < room.max).length} phòng mở</span>
      </header>
      <main className="rooms-main">
        {view === 'home' && <RoomOptions onCreate={() => setView('create')} onFind={() => setView('find')} onQuickJoin={quickJoin} message={message} />}
        {view === 'create' && <CreateRoomForm capacity={capacity} setCapacity={setCapacity} roomName={roomName} setRoomName={setRoomName} privateRoom={privateRoom} setPrivateRoom={setPrivateRoom} password={password} setPassword={setPassword} onSubmit={createRoom} />}
        {view === 'created' && createdRoom && <CreatedRoom room={createdRoom} message={message} onCopy={() => { navigator.clipboard?.writeText(createdRoom.code); setMessage('Đã sao chép mã phòng.'); }} onJoin={() => onJoin(createdRoom)} />}
        {view === 'find' && <FindRoomList rooms={rooms} query={query} setQuery={setQuery} onJoin={onJoin} />}
      </main>
    </section>
  );
}

function RoomOptions({ onCreate, onFind, onQuickJoin, message }) {
  return (
    <>
      <div className="rooms-intro"><label className="kicker">CHỌN CÁCH CHƠI</label><h1>Sẵn sàng vào bàn?</h1><p>Tạo phòng riêng, tìm bạn chơi hoặc vào nhanh phòng còn chỗ.</p></div>
      <div className="room-options">
        <Option icon={<Plus />} title="Tạo phòng" text="Chọn số người và thiết lập bàn chơi." onClick={onCreate} />
        <Option icon={<Search />} title="Tìm phòng" text="Xem các phòng đang chờ người chơi." onClick={onFind} tone="blue" />
        <Option icon={<RefreshCw />} title="Vào ngay" text="Chọn ngẫu nhiên một phòng còn chỗ." onClick={onQuickJoin} tone="gold" />
      </div>
      <div className="room-info"><Wifi size={15} /> Danh sách phòng hiện là dữ liệu mẫu, sẽ nối backend sau.</div>
      {message && <div className="inline-error">{message}</div>}
    </>
  );
}

function Option({ icon, title, text, onClick, tone = '' }) {
  return (
    <button className="room-option" onClick={onClick}>
      <span className={`option-icon ${tone ? `${tone}-icon` : ''}`}>{icon}</span>
      <b>{title}</b><small>{text}</small><ArrowRight className="option-arrow" />
    </button>
  );
}

function CreateRoomForm({ capacity, setCapacity, roomName, setRoomName, privateRoom, setPrivateRoom, password, setPassword, onSubmit }) {
  return (
    <>
      <div className="rooms-intro"><label className="kicker">THIẾT LẬP PHÒNG</label><h1>Tạo phòng mới</h1><p>Chọn số chỗ tối đa. Mã phòng tạo khi mở phòng.</p></div>
      <form className="room-form" onSubmit={onSubmit}>
        <label>Tên phòng<input value={roomName} onChange={(event) => setRoomName(event.target.value)} maxLength={24} /></label>
        <label>Số người chơi
          <div className="capacity-control">
            <button type="button" onClick={() => setCapacity(Math.max(3, Number(capacity) - 1))}>−</button>
            <strong>{capacity}<small> người</small></strong>
            <button type="button" onClick={() => setCapacity(Math.min(10, Number(capacity) + 1))}>+</button>
          </div>
          <small className="field-hint">Từ 3 đến 10 người</small>
        </label>
        <label className="toggle-row"><span><b>Phòng riêng</b><small>Chỉ người có mã phòng mới vào được.</small></span><input type="checkbox" checked={privateRoom} onChange={(event) => setPrivateRoom(event.target.checked)} /></label>
        {privateRoom && <label>Mật khẩu phòng<input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu (tuỳ chọn)" maxLength={16} /></label>}
        <div className="form-summary"><Users size={16} /> Mã phòng được tạo tự động sau khi mở.</div>
        <button className="primary room-submit" type="submit">Tạo phòng <ArrowRight size={17} /></button>
      </form>
    </>
  );
}

function CreatedRoom({ room, message, onCopy, onJoin }) {
  return (
    <div className="created-card">
      <span className="success-mark">✓</span><label className="kicker">PHÒNG ĐÃ SẴN SÀNG</label>
      <h1>{room.name}</h1><p>Chia sẻ mã này để bạn bè vào phòng.</p>
      <div className="code-box"><small>MÃ PHÒNG</small><strong>{room.code}</strong><span>{room.max} chỗ • {room.privateRoom ? 'Phòng riêng' : 'Phòng công khai'}</span></div>
      <div className="created-actions"><button className="secondary" onClick={onCopy}>Sao chép mã</button><button className="primary" onClick={onJoin}>Vào phòng chờ <ArrowRight size={16} /></button></div>
      {message && <small className="copy-note">{message}</small>}
    </div>
  );
}

function FindRoomList({ rooms, query, setQuery, onJoin }) {
  return (
    <>
      <div className="rooms-intro find-intro"><label className="kicker">PHÒNG ĐANG MỞ</label><h1>Tìm bàn chơi</h1><p>Chọn phòng đang chờ và còn chỗ.</p></div>
      <div className="room-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, chủ phòng hoặc mã" /><button onClick={() => setQuery('')} aria-label="Xóa tìm kiếm"><RefreshCw size={15} /></button></div>
      <div className="room-list">
        {rooms.map((room, index) => {
          const full = room.players >= room.max || room.state === 'Đã đầy';
          const playing = room.state === 'Đang chơi';
          return (
            <article className="room-row" key={room.code}>
              <span className={`room-avatar av${index}`}>✦</span>
              <div className="room-row-info"><b>{room.name} {playing && <small className="playing-tag">ĐANG CHƠI</small>}</b><small>Chủ phòng: {room.host}　•　{room.code}</small></div>
              <div className="room-count"><Users size={14} />{room.players}/{room.max}</div>
              <button className="join-btn" disabled={full || playing} onClick={() => onJoin(room)}>{full ? 'Đã đầy' : playing ? 'Đang chơi' : 'Vào phòng'}</button>
            </article>
          );
        })}
        {rooms.length === 0 && <div className="empty-rooms">Không tìm thấy phòng phù hợp.</div>}
      </div>
      <div className="find-bottom"><span><i /> Phòng mở, còn chỗ</span><button onClick={() => setQuery('')}><RefreshCw size={14} /> Làm mới</button></div>
    </>
  );
}
