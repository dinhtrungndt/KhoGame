import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Gamepad2, Shield } from 'lucide-react';
import { cards } from '../data/cards.js';

export default function AuthPage({ onContinue, onRecover, onHelp }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    onContinue({ mode, username: username.trim(), email: email.trim(), password })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  return (
    <section className="auth">
      <aside className="hero">
        <div className="brand">
          <i><Gamepad2 /></i>KHO<span>GAME</span><small>BETA</small>
        </div>
        <div className="hero-copy">
          <label>✧　PHÒNG CHƠI CỦA BẠN</label>
          <h1>Mỗi ván chơi,<br /><em>một câu chuyện.</em></h1>
          <p>Gặp hội bạn, chọn một trò yêu thích<br />và bắt đầu cuộc vui.</p>
          <div className="cards-deco" aria-label="Một vài lá bài trong bộ bài">
            <img src={cards.beardCat.image} alt={cards.beardCat.name} />
            <img src={cards.attack.image} alt={cards.attack.name} />
            <img src={cards.cattermelon.image} alt={cards.cattermelon.name} />
          </div>
        </div>
        <footer><span><Shield size={14} /> Chơi vui, chơi văn minh</span><span>01 / 02</span></footer>
      </aside>

      <section className="auth-side">
        <div className="mini-brand"><Gamepad2 /> KHO GAME</div>
        <div className="auth-box">
          <label className="kicker">CHÀO MỪNG BẠN ĐẾN VỚI KHO GAME</label>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p>{mode === 'login' ? 'Đăng nhập để vào phòng chơi của bạn.' : 'Tạo hồ sơ người chơi của bạn.'}</p>

          <form onSubmit={submit}>
            <label>
              Tên đăng nhập
              <input
                autoComplete="username"
                placeholder="Tên đăng nhập của bạn"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            {mode === 'register' && (
              <label>
                Email khôi phục
                <input type="email" autoComplete="email" placeholder="ban@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
            )}
            <label>
              Mật khẩu
              <div className="pass">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Ít nhất 8 ký tự"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện hoặc ẩn mật khẩu">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            {mode === 'login' && (
              <button type="button" className="forgot" onClick={onRecover}>Quên mật khẩu?</button>
            )}
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={17} />
            </button>
          </form>
          {error && <div className="auth-error" role="alert">{error}</div>}

          <div className="switch">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </div>
          <div className="terms">Tiếp tục đồng nghĩa bạn đồng ý với Điều khoản và Chính sách riêng tư.</div>
        </div>
        <footer><span>© 2026 Kho Game</span><button onClick={onHelp}>Trợ giúp</button></footer>
      </section>
    </section>
  );
}
