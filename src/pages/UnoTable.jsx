import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Home, Music2, Settings, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { unoCards, back, unoLogo } from '../unoCards.js';
import { createGameSocket } from '../realtime.js';
import { playSfx } from '../audio.js';
import RoomChat from '../RoomChat.jsx';

const seatPoint = (index, total) => {
  const angle = (Math.PI * 2 * index) / Math.max(1, total);
  return { x: 50 + Math.cos(angle) * 34, y: 50 + Math.sin(angle) * 30 };
};

const orderForDisplay = (players, anchorId) => {
  const ordered = [...players].sort((a, b) => a.seat - b.seat);
  const anchorIndex = ordered.findIndex((player) => String(player.userId) === String(anchorId));
  return anchorIndex > 0 ? [...ordered.slice(anchorIndex), ...ordered.slice(0, anchorIndex)] : ordered;
};

export default function UnoTable({ room, sound, music, onToggleSound, onToggleMusic, onHome, onSettings, onGameNotice }) {
  const [socket, setSocket] = useState(null);
  const [game, setGame] = useState(null);
  const [hand, setHand] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawnPlayableCardId, setDrawnPlayableCardId] = useState(null);
  const [chosenColor, setChosenColor] = useState('red');
  const [busy, setBusy] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [connectionError, setConnectionError] = useState('');
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const localPlayRef = useRef(false);

  useEffect(() => {
    let s = createGameSocket(room.code);
    setSocket(s);
    s.on('connect', () => {
      setConnectionError('');
      s.emit('room:join', { code: room.code }, (result) => {
        if (!result?.ok) setConnectionError(result?.error || 'Không thể tải trạng thái phòng UNO.');
      });
    });
    s.on('connect_error', (error) => setConnectionError(error.message === 'AUTH_REQUIRED' ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.' : 'Mất kết nối máy chủ UNO.'));
    s.on('game:state', (state) => {
      setGame(state);
      setBusy(false);
      localPlayRef.current = false;
    });
    s.on('room:closed', () => setConnectionError('Phòng UNO đã đóng.'));
    s.on('game:private', (priv) => {
      setUserId(priv.userId);
      setHand(priv.hand);
      setDrawnPlayableCardId(priv.drawnPlayableCardId ?? null);
      if (priv.drawn?.length > 0) {
        setSelectedCard(null);
        if (soundRef.current) playSfx('draw');
      }
    });
    s.connect();
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, [room.code]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const request = (event, payload = {}, callback) => {
    if (!socket?.connected || busy) return;
    setBusy(true);
    socket.emit(event, { code: room.code, ...payload }, (res) => {
      setBusy(false);
      if (!res?.ok && res?.error) {
        onGameNotice?.(res.error);
        if (sound) playSfx('error');
      } else {
        if (sound) playSfx('play');
        callback?.(res);
      }
    });
  };

  const isMyTurn = game?.currentPlayerId === userId && game?.status === 'playing' && !localPlayRef.current;
  const tablePlayers = useMemo(() => orderForDisplay(game?.players ?? [], userId), [game?.players, userId]);
  
  const topCard = game?.discardPile?.[game.discardPile.length - 1];

  function isPlayable(card) {
    if (!game || !topCard) return false;
    if (game.drawnCardUserId) return String(game.drawnCardUserId) === String(userId) && card.id === drawnPlayableCardId;
    if (game.pendingDrawCount > 0) return topCard.type === 'wild_draw4' ? card.type === 'wild_draw4' : card.type === 'draw2' || card.type === 'wild_draw4';
    if (card.type === 'wild_draw4' && hand.some((heldCard) => heldCard.color === game.activeColor)) return false;
    return card.color === 'black' || card.color === game.activeColor || (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) || (card.type !== 'number' && topCard.type !== 'number' && card.type === topCard.type);
  }

  function playSelected() {
    if (!selectedCard) return;
    if (selectedCard.color === 'black' && !chosenColor) {
      onGameNotice?.('Hãy chọn màu trước khi đánh lá Đổi màu.');
      return;
    }
    localPlayRef.current = true;
    request('uno:play', { cardId: selectedCard.id, chosenColor: selectedCard.color === 'black' ? chosenColor : undefined }, () => {
      setSelectedCard(null);
    });
  }

  function callUno() {
    request('uno:call');
  }

  const timeLeft = Math.max(0, Math.ceil(((game?.turnDeadline ?? Date.now()) - clockNow) / 1000));
  const me = game?.players?.find(p => p.userId === userId);
  const awaitingDrawChoice = String(game?.drawnCardUserId) === String(userId) && Boolean(drawnPlayableCardId);

  return (
    <section className="table uno-layout">
      <header className="table-header">
        <button className="icon-btn" onClick={onHome}><Home size={20} /></button>
        <div className="table-brand">
          <img src={unoLogo} alt="UNO" className="game-logo-small" style={{height: 30}} />
          <div className="room-info"><span>PHÒNG: <strong>{room?.code}</strong></span></div>
        </div>
        <div className="table-tools">
          <button className="icon-btn" onClick={onToggleMusic}>{music ? <Music2 size={20} /> : <div style={{position: 'relative'}}><Music2 size={20} /><div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, transparent 45%, red 45%, red 55%, transparent 55%)'}} /></div>}</button>
          <button className="icon-btn" onClick={onToggleSound}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
          <button className="icon-btn" onClick={onSettings}><Settings size={20} /></button>
        </div>
      </header>

      {connectionError && <div className="uno-connection-error" role="alert">{connectionError}</div>}
      <main className="felt uno-felt">
        <div className="center-pile">
          {game?.direction === -1 && <div className="direction-indicator counter-clockwise">↺</div>}
          {game?.direction === 1 && <div className="direction-indicator clockwise">↻</div>}

          <div className={`deck draw-pile ${isMyTurn && !busy && !game?.drawnCardUserId ? 'can-draw' : ''}`} role="button" tabIndex={isMyTurn && !game?.drawnCardUserId ? 0 : -1} onClick={() => isMyTurn && !busy && !game?.drawnCardUserId && request('uno:draw')} onKeyDown={(event) => { if (isMyTurn && !busy && !game?.drawnCardUserId && (event.key === 'Enter' || event.key === ' ')) request('uno:draw'); }}>
            <img src={back} alt="Draw" />
            <span className="count">{game?.drawPileCount ?? 0}</span>
          </div>

          {topCard && (
            <div className="deck discard-pile">
              <img src={unoCards[topCard.key]?.image} alt={topCard.key} />
              {topCard.color === 'black' && game?.activeColor && (
                <div className="active-color-indicator" style={{ backgroundColor: game.activeColor, width: 20, height: 20, borderRadius: '50%', position: 'absolute', bottom: -10, right: -10, border: '2px solid white' }} />
              )}
            </div>
          )}
        </div>

        {tablePlayers.map((player, index) => {
          const pos = seatPoint(index, tablePlayers.length);
          const handData = game?.playerHandCounts?.find((h) => String(h.userId) === String(player.userId));
          const isSelf = String(player.userId) === String(userId);
          const isTurn = String(game?.currentPlayerId) === String(player.userId);
          return (
            <div key={player.userId} className={`opponent-seat ${isSelf ? 'is-self' : ''} ${isTurn ? 'is-turn' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <div className="avatar">{player.username.charAt(0).toUpperCase()}</div>
              <div className="info">
                <span className="name">{player.username}{isSelf ? ' · Bạn' : ''}</span>
                <span className="cards-count">🃏 {handData?.count ?? 0} {handData?.unoCalled && <span className="uno-called-mark">UNO!</span>}</span>
                {isTurn && <div className="timer-bar"><div className="fill" style={{ animationDuration: '15s' }} /></div>}
              </div>
            </div>
          );
        })}
      </main>

      <section className="hand live-hand">
        <div className="hand-title">
          BÀI CỦA {me?.username?.toLocaleUpperCase() ?? 'BẠN'}　<b>{hand.length}</b>
        </div>
        
        <div className={`cards ${hand.length > 7 ? 'many-cards' : ''}`}>
          {hand.map((card) => {
            const info = unoCards[card.key];
            if (!info) return null;
            return (
              <button 
                key={card.id} 
                className={`playing-card asset-card ${selectedCard?.id === card.id ? 'chosen' : ''} ${!isPlayable(card) ? 'uno-unplayable' : ''}`} 
                disabled={!isMyTurn || !isPlayable(card) || busy}
                onClick={() => setSelectedCard((current) => current?.id === card.id ? null : card)}
              >
                <img src={info.image} alt={info.name} />
              </button>
            );
          })}
        </div>

        <div className="actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          {game?.pendingDrawCount > 0 && <div style={{color: 'red', fontWeight: 'bold'}}>Đang nợ +{game.pendingDrawCount} lá</div>}
          
          {awaitingDrawChoice ? <button className="secondary" onClick={() => request('uno:pass')} disabled={!isMyTurn || busy}>Bỏ lượt</button> : <button className="secondary" onClick={() => request('uno:draw')} disabled={!isMyTurn || busy || Boolean(game?.drawnCardUserId)}>↧ Rút bài</button>}
          
          {selectedCard && selectedCard.color === 'black' && (
            <select value={chosenColor} onChange={e => setChosenColor(e.target.value)} style={{padding: '5px', borderRadius: '5px', background: '#333', color: 'white', border: '1px solid #555'}}>
              <option value="red">Đỏ</option>
              <option value="blue">Xanh dương</option>
              <option value="green">Xanh lá</option>
              <option value="yellow">Vàng</option>
            </select>
          )}

          <button className="primary" onClick={playSelected} disabled={!isMyTurn || !selectedCard || busy}>
            Đánh lá này
          </button>

          <button className="danger" onClick={callUno} disabled={hand.length > 2 || me?.unoCalled || busy} style={{background: '#e11d48', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', opacity: (hand.length > 2 || me?.unoCalled || busy) ? 0.5 : 1}}>
            Hô UNO!
          </button>

          <span style={{marginLeft: 'auto'}}>
            {game?.status === 'finished' ? `Người thắng: ${game.players.find((player) => player.userId === game.winnerId)?.username ?? ''}` : isMyTurn ? `Đến lượt bạn (${timeLeft}s)` : 'Đang chờ lượt'}
          </span>
        </div>
      </section>

      {game?.status === 'finished' && <div className="uno-victory-overlay"><section><small>VÁN UNO KẾT THÚC</small><h1>🎉 {game.players.find((player) => player.userId === game.winnerId)?.username ?? 'Người chơi'} thắng! 🎉</h1>{me?.isHost ? <button className="primary" onClick={() => request('game:restart')}>Chơi ván mới</button> : <p>Đang chờ chủ phòng bắt đầu ván mới.</p>}</section></div>}
      {socket?.connected && userId && (
        <RoomChat socket={socket} roomCode={room?.code} userId={userId} />
      )}
    </section>
  );
}
