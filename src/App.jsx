import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import AuthPage from './pages/AuthPage.jsx';
import LobbyPage from './pages/LobbyPage.jsx';
import GameTable from './pages/GameTable.jsx';
import Rooms from './Rooms.jsx';
import RoomLobby from './RoomLobby.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import { api } from './api.js';
import { playSfx, setMusicEnabled, unlockAudio } from './audio.js';

export default function App() {
  const resetToken = new URLSearchParams(window.location.search).get('token');
  const [page, setPage] = useState(resetToken ? 'reset' : 'auth');
  const [username, setUsername] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedGame, setSelectedGame] = useState('cat');
  const [room, setRoom] = useState(null);
  const [modal, setModal] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [notice, setNotice] = useState('');
  const [sound, setSound] = useState(true);
  const [music, setMusic] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const captureInstallPrompt = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    
    // Attempt to lock screen orientation to landscape
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) { setModal('install-help'); return; }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === 'accepted') setInstallPrompt(null);
  }

  useEffect(() => {
    if (resetToken) return;
    api.me().then(({ user }) => { setUsername(user.username); setPage('lobby'); }).catch(() => {});
  }, []);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    setMusicEnabled(music);
    return () => setMusicEnabled(false);
  }, [music]);

  async function authenticate(credentials) {
    const result = credentials.mode === 'register'
      ? await api.register(credentials)
      : await api.login(credentials);
    setUsername(result.user.username);
    setPage('lobby');
  }

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1900);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await api.logout();
      setUsername('');
      setRoom(null);
      setPage('auth');
      showNotice('Bạn đã đăng xuất.');
    } catch (error) {
      showNotice(error.message);
    } finally {
      setLoggingOut(false);
    }
  }

  function continueFromLobby() {
    if (selectedGame === 'cat') {
      setPage('rooms');
      return;
    }
    setPage('table');
    showNotice('Bản giao diện xem trước');
  }

  function joinRoom(nextRoom) {
    playSfx('enter', sound);
    setRoom(nextRoom);
    setPage('roomLobby');
  }

  const startRoomGame = useCallback(() => setPage('table'), []);

  async function leaveCurrentRoom() {
    await api.leaveRoom(room.code);
    setRoom(null);
    setPage('rooms');
  }

  async function resetPassword(password) {
    await api.resetPassword(resetToken, password);
    window.history.replaceState({}, '', '/');
    setPage('auth');
    setModal('password-reset');
  }

  async function submitRecovery(event) {
    event.preventDefault();
    setRecoveryError('');
    try {
      await api.forgotPassword(recoveryEmail);
      setModal('recovery-sent');
    } catch (error) {
      setRecoveryError(error.message);
    }
  }

  return (
    <main className="app">
      <div className="orb" />
      {page === 'reset' && <ResetPasswordPage onSubmit={resetPassword} onBack={() => { window.history.replaceState({}, '', '/'); setPage('auth'); }} />}
      {page === 'auth' && (
        <AuthPage
          onContinue={authenticate}
          onRecover={() => setModal('recovery')}
          onHelp={() => setModal('help')}
          onInstall={installApp}
        />
      )}
      {page === 'lobby' && (
        <LobbyPage
          username={username}
          loggingOut={loggingOut}
          onLogout={logout}
          selectedGame={selectedGame}
          onSelect={(game) => { setSelectedGame(game); if (game === 'cat') setPage('rooms'); }}
          onContinue={continueFromLobby}
          onInstall={installApp}
        />
      )}
      {page === 'rooms' && <Rooms onBack={() => setPage('lobby')} onJoin={joinRoom} />}
      {page === 'roomLobby' && room && <RoomLobby room={room} onLeave={leaveCurrentRoom} onStartGame={startRoomGame} sound={sound} />}
      {page === 'table' && (
        <GameTable
          room={room}
          gameName={selectedGame === 'cat' ? 'Mèo Nổ' : 'UNO'}
          sound={sound}
          music={music}
          onToggleSound={() => setSound((enabled) => !enabled)}
          onToggleMusic={() => setMusic((enabled) => !enabled)}
          onHome={() => setPage('lobby')}
          onSettings={() => setModal('settings')}
          onGameNotice={showNotice}
        />
      )}

      {notice && <div className="toast"><Check size={16} />{notice}</div>}
      {modal && (
        <div className="scrim" onClick={() => setModal('')}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="x" onClick={() => setModal('')} aria-label="Đóng"><X /></button>
            <Sparkles />
            <h3>{modal === 'recovery' ? 'Khôi phục mật khẩu' : modal === 'password-reset' ? 'Đổi mật khẩu thành công' : modal === 'recovery-sent' ? 'Đã ghi nhận yêu cầu' : modal === 'rules' ? 'Hướng dẫn luật chơi' : modal === 'settings' ? 'Cài đặt' : modal === 'install-help' ? 'Thêm Kho Game vào màn hình chính' : 'Thông tin'}</h3>
            {modal === 'recovery' ? (
              <>
                <p>Nhập email đã dùng khi đăng ký để nhận liên kết khôi phục mật khẩu.</p>
                <form className="recover-form" onSubmit={submitRecovery}>
                  <input type="email" autoComplete="email" placeholder="ban@email.com" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} required />
                  {recoveryError && <div className="auth-error" role="alert">{recoveryError}</div>}
                  <button className="primary">Gửi yêu cầu <ArrowRight size={16} /></button>
                </form>
              </>
            ) : (
              <>
                <p>{modal === 'recovery-sent' ? 'Nếu email tồn tại trong hệ thống, liên kết khôi phục sẽ được gửi đến hộp thư của bạn.' : modal === 'password-reset' ? 'Mật khẩu mới đã được lưu. Bạn có thể đăng nhập bằng mật khẩu vừa đặt.' : modal === 'install-help' ? ((/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'Trên Safari, nhấn nút Chia sẻ, chọn Thêm vào MH chính rồi nhấn Thêm.' : 'Mở menu của trình duyệt rồi chọn Cài đặt ứng dụng hoặc Thêm vào màn hình chính. Trên iPhone/iPad, hãy mở trang bằng Safari và dùng nút Chia sẻ.') : 'Đây là bản giao diện thử nghiệm. Luật chơi và cài đặt sẽ được hoàn thiện ở bước tiếp theo.'}</p>
                <button className="primary" onClick={() => setModal('')}>Đã hiểu <Check size={16} /></button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
