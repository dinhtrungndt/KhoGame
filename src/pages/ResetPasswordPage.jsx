import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Gamepad2 } from 'lucide-react';

export default function ResetPasswordPage({ onSubmit, onBack }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirm) { setError('Mật khẩu nhập lại chưa khớp.'); return; }
    setLoading(true);
    try { await onSubmit(password); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  return (
    <section className="reset-page">
      <div className="reset-box">
        <div className="mini-brand"><Gamepad2 /> KHO GAME</div>
        <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Quay lại đăng nhập</button>
        <label className="kicker">BẢO MẬT TÀI KHOẢN</label>
        <h1>Đặt mật khẩu mới</h1>
        <p>Liên kết khôi phục có hiệu lực trong 30 phút và chỉ dùng một lần.</p>
        <form onSubmit={submit}>
          <label>Mật khẩu mới<div className="pass"><input type={show ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Ít nhất 8 ký tự" /><button type="button" onClick={() => setShow(!show)} aria-label="Hiện hoặc ẩn mật khẩu">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <label>Nhập lại mật khẩu<input type={show ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={72} value={confirm} onChange={(event) => setConfirm(event.target.value)} required placeholder="Nhập lại mật khẩu mới" /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary" disabled={loading}>{loading ? 'Đang lưu…' : 'Lưu mật khẩu mới'} <ArrowRight size={17} /></button>
        </form>
      </div>
    </section>
  );
}
