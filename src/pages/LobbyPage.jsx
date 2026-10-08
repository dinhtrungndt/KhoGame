import React from 'react';
import { ArrowRight, Download, LogOut, Shield } from 'lucide-react';
import logo from '../assets/logo/tsa.png';

const games = [
  {
    id: 'meono',
    name: 'Mèo Nổ',
    subtitle: 'Đấu trí • 3–10 người',
    description: 'Đánh bài khéo léo, đoán ý đối thủ và đừng để vận may phản chủ.',
    icon: '✦',
    category: 'BÀI CHIẾN THUẬT',
  },
  {
    id: 'uno',
    name: 'UNO',
    subtitle: 'Bài vui • 2–10 người',
    description: 'Đổi màu, chặn lượt và về bài trước mọi người.',
    icon: '◉',
    category: 'BÀI GIA ĐÌNH',
  },
];

export default function LobbyPage({ username, selectedGame, onSelect, onContinue, onLogout, loggingOut, onInstall }) {
  const game = games.find((item) => item.id === selectedGame) ?? games[0];

  return (
    <section className="lobby">
      <header>
        <div className="brand"><i><img src={logo} alt="" /></i>KHO<span>GAME</span><small>BETA</small></div>
        <div className="profile-actions"><button className="install-button" onClick={onInstall}><Download size={14} /> Thêm vào màn hình chính</button><span className="profile">●　{username || 'Bạn chơi'}</span><button className="logout-button" onClick={onLogout} disabled={loggingOut}><LogOut size={15} />{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>
      </header>
      <article className="lobby-content">
        <div className="center">
          <label className="kicker">✧　CHỌN TRÒ CHƠI</label>
          <h1>Tối nay mình chơi gì?</h1>
          <p>Chọn một bàn chơi để bắt đầu cùng mọi người.</p>
        </div>
        <div className="games">
          {games.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`game ${selectedGame === item.id ? 'selected' : ''}`}
            >
              <small>{item.category}</small>
              <i className={`emblem e${index}`}>{item.icon}</i>
              <strong>{item.name}</strong>
              <span>{item.subtitle}</span>
              <p>{item.description}</p>
              <footer>● ● ● ●　{index === 0 ? 'Phòng đang chờ' : 'Sẵn sàng chơi'}</footer>
            </button>
          ))}
        </div>
        <div className="cta">
          <span><b>✧　{game.name} đã sẵn sàng</b><small>{game.description}</small></span>
          <button className="primary" onClick={onContinue}>Tiếp tục <ArrowRight size={17} /></button>
        </div>
        <div className="note"><Shield size={14} /> Bản giao diện thử nghiệm • Chơi online sẽ kết nối sau</div>
      </article>
      <footer className="lobby-foot">© 2026 KHO GAME <span>CHƠI CÙNG NHAU, VUI CÙNG NHAU</span></footer>
    </section>
  );
}
