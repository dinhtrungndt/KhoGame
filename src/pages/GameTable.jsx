import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CircleHelp, Home, Music2, Settings, Volume2, VolumeX } from 'lucide-react';
import { cards } from '../data/cards.js';
import { createGameSocket } from '../realtime.js';
import RulesGuide from './RulesGuide.jsx';

const cardInfo = (card) => cards[card?.key] || null;

export default function GameTable({ room, gameName, sound, music, onToggleSound, onToggleMusic, onHome, onSettings, onGameNotice }) {
  const [socket, setSocket] = useState(null);
  const [game, setGame] = useState(null);
  const [hand, setHand] = useState([]);
  const [userId, setUserId] = useState(null);
  const [pendingBomb, setPendingBomb] = useState(null);
  const [selected, setSelected] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [peek, setPeek] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const me = game?.players.find((player) => player.userId === userId);
  const isMyTurn = game?.currentPlayerId === userId && Boolean(me?.alive) && !pendingBomb;
  const chosenCard = hand.find((item) => item.id === selected);
  const chosenInfo = cardInfo(chosenCard);
  const opponents = useMemo(() => (game?.players ?? []).filter((player) => player.userId !== userId), [game?.players, userId]);

  useEffect(() => {
    const connection = createGameSocket();
    setSocket(connection);
    connection.on('connect', () => connection.emit('room:join', { code: room?.code }));
    connection.on('room:you', ({ userId: currentId }) => setUserId(currentId));
    connection.on('game:state', setGame);
    connection.on('game:private', (data) => {
      setUserId((currentId) => {
        if (currentId == null || currentId === data.userId) {
          setHand(data.hand || []);
          setPendingBomb(data.pendingBomb || null);
          if (data.peek) setPeek(data.peek);
          return data.userId;
        }
        return currentId;
      });
    });
    connection.on('connect_error', (error) => onGameNotice?.(error.message === 'AUTH_REQUIRED' ? 'Phiên đăng nhập đã hết hạn.' : 'Mất kết nối với bàn chơi.'));
    connection.connect();
    setSocket(connection);
    return () => { connection.removeAllListeners(); connection.disconnect(); };
  }, [room?.code, onGameNotice]);

  function request(event, payload, done = () => {}) {
    if (!socket?.connected || busy) return;
    setBusy(true);
    socket.emit(event, { code: room?.code, ...payload }, (result) => {
      setBusy(false);
      if (!result?.ok) onGameNotice?.(result?.error || 'Không thể thực hiện thao tác.');
      else done(result);
    });
  }

  function toggleCard(card) { setSelected((current) => current === card.id ? null : card.id); setTargetId(null); }
  function playSelected() {
    if (!chosenCard || !isMyTurn) return;
    if (chosenCard.key === 'favor' && !targetId) { onGameNotice?.('Chọn người chơi để dùng Favor.'); return; }
    request('game:play', { cardId: chosenCard.id, targetUserId: targetId }, () => { setSelected(null); setTargetId(null); });
  }

  const discard = cards[game?.discardTop];
  const currentPlayer = game?.players.find((player) => player.userId === game.currentPlayerId);
  const pending = game?.pendingBombUserId === userId;

  return (
    <section className="table live-game-table">
      <header>
        <button className="circle" onClick={onHome} aria-label="Về menu"><Home /></button>
        <div className="table-brand"><i>✦</i><b>{gameName}<small>{room?.code ?? 'ĐANG KẾT NỐI'} • VÁN TRỰC TUYẾN</small></b></div>
        <div className="tools"><button className="circle" onClick={onToggleSound} aria-label="Âm thanh">{sound ? <Volume2 /> : <VolumeX />}</button><button className="circle" onClick={onToggleMusic} aria-label="Nhạc nền"><Music2 /></button><button className="circle" onClick={onSettings} aria-label="Cài đặt"><Settings /></button></div>
      </header>

      <section className="felt live-felt">
        {opponents.map((player, index) => <article key={player.userId} className={`live-seat live-seat-${index % 6} ${!player.alive ? 'player-out' : ''}`}><span className={`lobby-avatar av${index % 6}`}>{player.username.slice(0, 1).toLocaleUpperCase()}</span><b>{player.username}{player.isHost ? ' ✦' : ''}</b><small>{player.alive ? `${player.handCount} lá` : 'Đã bị loại'}</small>{player.userId === game?.currentPlayerId && <em>LƯỢT ĐANG CHƠI</em>}</article>)}
        <div className="live-center">
          <div className="turn-label">{!game ? 'ĐANG CHIA BÀI…' : isMyTurn ? '●　LƯỢT CỦA BẠN' : `●　LƯỢT ${currentPlayer?.username ?? 'ĐANG CHỜ'}`}</div>
          <div className="live-piles">
            <button className={`deck-stack live-deck ${isMyTurn && !busy ? 'deck-enabled' : ''}`} onClick={() => request('game:draw')} disabled={!isMyTurn || busy || !game?.drawPileCount} aria-label="Rút bài"><span className="deck-layer layer-three" /><span className="deck-layer layer-two" /><span className="deck-layer layer-one" /><span className="deck-front"><b>✦</b><strong>{game?.drawPileCount ?? '—'}</strong><small>LÁ CÒN LẠI</small></span></button>
            <div className="discard-pile"><small>BÀI ĐÃ ĐÁNH</small>{discard ? <img className="discard-image" src={discard.image} alt={discard.name} /> : <div className="empty-discard">Chưa có bài bỏ</div>}</div>
          </div>
          {game?.pendingTurns > 0 && <span className="attack-turns">⚡ Bạn còn {game.pendingTurns} lượt</span>}
          <small>{isMyTurn ? 'Đánh lá phù hợp hoặc rút bài để kết thúc lượt.' : game ? `Đang chờ ${currentPlayer?.username ?? 'người chơi'} thao tác.` : 'Đang kết nối máy chủ và nhận bài.'}</small>
        </div>
        <footer><span>{game?.players.filter((player) => player.alive).length ?? 0} người còn sống</span><span>MÃ PHÒNG　<b>{room?.code}</b></span></footer>
      </section>

      {pending && <div className="bomb-prompt"><div><b>💣 Bạn rút trúng Mèo Nổ!</b><span>Đã dùng Gỡ Bom. Chọn vị trí bí mật đặt lại lá bom vào chồng bài.</span></div><div className="bomb-positions"><button onClick={() => request('game:reinsert', { position: 0 })}>Trên cùng</button><button onClick={() => request('game:reinsert', { position: Math.floor((game?.drawPileCount ?? 0) / 2) })}>Ở giữa</button><button onClick={() => request('game:reinsert', { position: game?.drawPileCount ?? 0 })}>Dưới cùng</button></div></div>}
      {peek && <div className="peek-strip"><b>Ba lá trên cùng:</b>{peek.map((key, index) => <span key={`${key}-${index}`}>{cards[key]?.name ?? key}</span>)}<button onClick={() => setPeek(null)}>Đóng</button></div>}
      {chosenCard && <aside className="card-detail live-card-detail"><img src={chosenInfo?.image} alt={chosenInfo?.name} /><div><span>CHỨC NĂNG LÁ BÀI</span><h3>{chosenInfo?.name}</h3><p>{chosenInfo?.description}</p>{chosenCard.key === 'favor' && <div className="target-picker">{opponents.filter((player) => player.alive && player.handCount > 0).map((player) => <button key={player.userId} className={targetId === player.userId ? 'target-selected' : ''} onClick={() => setTargetId(player.userId)}>{player.username}</button>)}</div>}<button className="primary" onClick={playSelected} disabled={!isMyTurn || busy || !['attack', 'skip', 'favor', 'seeTheFuture', 'shuffle'].includes(chosenCard.key)}>{busy ? 'Đang xử lý…' : isMyTurn ? 'Đánh lá này' : 'Chưa tới lượt'} <ArrowRight size={15} /></button></div></aside>}

      <section className="hand live-hand"><div className="hand-title">BÀI CỦA {me?.username?.toLocaleUpperCase() ?? 'BẠN'}　<b>{hand.length}</b><span><button onClick={() => setGuideOpen(true)}><CircleHelp size={14} /> Hướng dẫn</button></span></div><div className="cards">{hand.map((card) => { const info = cardInfo(card); return info ? <button key={card.id} className={`playing-card asset-card ${selected === card.id ? 'chosen' : ''}`} onClick={() => toggleCard(card)} aria-pressed={selected === card.id} aria-label={`Chọn ${info.name}`}><img src={info.image} alt={info.name} /></button> : null; })}</div><div className="actions"><button className="secondary" onClick={() => request('game:draw')} disabled={!isMyTurn || busy}>↧　Bốc bài</button><span>{game?.status === 'finished' ? `Người thắng: ${game.players.find((player) => player.userId === game.winnerId)?.username ?? ''}` : isMyTurn ? 'Đến lượt của bạn' : 'Đang chờ lượt'}</span></div></section>
      {guideOpen && <RulesGuide onClose={() => setGuideOpen(false)} />}
    </section>
  );
}
