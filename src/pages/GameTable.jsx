import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CircleHelp, Home, Music2, Settings, Volume2, VolumeX } from 'lucide-react';
import { cards } from '../data/cards.js';
import { createGameSocket } from '../realtime.js';
import RulesGuide from './RulesGuide.jsx';
import { playSfx } from '../audio.js';

const cardInfo = (card) => cards[card?.key] || null;
const seatPoint = (index, total) => {
  const angle = (Math.PI * 2 * index) / Math.max(1, total);
  return { x: 50 + Math.cos(angle) * 42, y: 50 + Math.sin(angle) * 37 };
};
const orderForDisplay = (players, anchorId) => {
  const ordered = [...players].sort((a, b) => a.seat - b.seat);
  const anchorIndex = ordered.findIndex((player) => player.userId === anchorId);
  return anchorIndex > 0 ? [...ordered.slice(anchorIndex), ...ordered.slice(0, anchorIndex)] : ordered;
};

export default function GameTable({ room, gameName, sound, music, onToggleSound, onToggleMusic, onHome, onSettings, onGameNotice }) {
  const [socket, setSocket] = useState(null);
  const [game, setGame] = useState(null);
  const [hand, setHand] = useState([]);
  const [userId, setUserId] = useState(null);
  const [pendingBomb, setPendingBomb] = useState(null);
  const [pendingCombo, setPendingCombo] = useState(null);
  const [bombPosition, setBombPosition] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetId, setTargetId] = useState(null);
  const [namedCardKey, setNamedCardKey] = useState('');
  const [discardCardId, setDiscardCardId] = useState('');
  const [peek, setPeek] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [dealing, setDealing] = useState(false);
  const [dealCards, setDealCards] = useState([]);
  const [flightCards, setFlightCards] = useState([]);
  const [shuffling, setShuffling] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const hasInitialGame = useRef(false);
  const dealTimer = useRef(null);
  const flightTimer = useRef(null);
  const peekTimer = useRef(null);
  const shuffleTimer = useRef(null);
  const userIdRef = useRef(null);
  const previousGame = useRef(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const lastHandSize = useRef(null);
  const lastBomb = useRef(false);
  const localPlayRef = useRef(false);
  const me = game?.players.find((player) => player.userId === userId);
  const isMyTurn = game?.currentPlayerId === userId && Boolean(me?.alive) && !pendingBomb && !game?.pendingCombo && !game?.pendingAction;
  const selectedCards = hand.filter((item) => selectedIds.includes(item.id));
  const chosenCard = selectedCards[0];
  const chosenInfo = cardInfo(chosenCard);
  const selectedKeys = selectedCards.map((card) => card.key);
  const catCards = selectedCards.every((card) => ['beardCat', 'cattermelon', 'hairyPotato', 'tacocat', 'rainbowCat'].includes(card.key));
  const sameCat = catCards && new Set(selectedKeys).size === 1;
  const pairCombo = selectedCards.length === 2 && sameCat;
  const tripleCombo = selectedCards.length === 3 && sameCat;
  const fiveCombo = selectedCards.length === 5 && new Set(selectedKeys).size === 5;
  const singleAction = selectedCards.length === 1 && (['attack', 'skip', 'favor', 'seeTheFuture', 'shuffle'].includes(chosenCard?.key) || chosenCard?.key === 'nope' && Boolean(game?.pendingAction));
  const playValid = singleAction || pairCombo || tripleCombo || fiveCombo;
  const comboTitle = pairCombo ? 'Combo: 2 lá mèo cùng loại' : tripleCombo ? 'Combo: 3 lá mèo cùng loại' : fiveCombo ? 'Combo: 5 lá khác loại' : chosenInfo?.name;
  const comboMessage = pairCombo ? 'Chọn người chơi để lấy ngẫu nhiên một lá trên tay họ.' : tripleCombo ? 'Chọn người chơi; bài của họ sẽ úp xuống để bạn chọn một lá.' : fiveCombo ? 'Chọn 1 lá trong chồng bài bỏ để lấy về tay.' : chosenInfo?.description;
  const tablePlayers = useMemo(() => orderForDisplay(game?.players ?? [], userId), [game?.players, userId]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const connection = createGameSocket();
    setSocket(connection);
    connection.on('connect', () => connection.emit('room:join', { code: room?.code }));
    connection.on('room:you', ({ userId: currentId }) => { userIdRef.current = currentId; setUserId(currentId); });
    connection.on('game:state', (nextGame) => {
      const prior = previousGame.current;
      if (prior && prior.discardTop !== nextGame.discardTop && nextGame.discardTop) {
        const key = nextGame.discardTop;
        if (localPlayRef.current) localPlayRef.current = false;
        else playSfx(key === 'skip' ? 'skip' : key === 'attack' ? 'attack' : key === 'nope' ? 'nope' : 'play', soundRef.current);
      }
      if (prior?.status !== 'finished' && nextGame.status === 'finished') {
        setShowVictory(true);
        playSfx('win', soundRef.current);
      }
      if (prior?.pendingAction?.cardKeys?.length === 1 && prior.pendingAction.cardKeys[0] === 'shuffle' && prior.pendingAction.nopeCount % 2 === 0 && !nextGame.pendingAction) {
        setShuffling(true);
        window.clearTimeout(shuffleTimer.current);
        shuffleTimer.current = window.setTimeout(() => setShuffling(false), 1100);
      }
      previousGame.current = nextGame;
      setGame(nextGame);
      if (hasInitialGame.current) return;
      hasInitialGame.current = true;
      const isFreshDeal = nextGame.startedAt && Date.now() - nextGame.startedAt < 12_000;
      if (!isFreshDeal) return;
      playSfx('deal', soundRef.current);
      const sequence = [];
      const players = orderForDisplay(nextGame.players, userIdRef.current);
      for (let round = 0; round < 5; round += 1) {
        players.forEach((player, playerIndex) => {
          const point = seatPoint(playerIndex, players.length);
          sequence.push({ id: `${round}-${player.userId}`, x: point.x, y: point.y, delay: (round * players.length + playerIndex) * 48 });
        });
      }
      setDealCards(sequence);
      setDealing(true);
      dealTimer.current = window.setTimeout(() => setDealing(false), 700 + sequence.length * 48);
    });
    connection.on('game:private', (data) => {
      if (userIdRef.current != null && userIdRef.current !== data.userId) return;
      userIdRef.current = data.userId;
      setUserId(data.userId);
      const nextHand = data.hand || [];
      if (lastHandSize.current !== null && nextHand.length > lastHandSize.current) playSfx('draw', soundRef.current);
      lastHandSize.current = nextHand.length;
      if (data.pendingBomb && !lastBomb.current) playSfx('bomb', soundRef.current);
      if (!data.pendingBomb && lastBomb.current) playSfx('defuse', soundRef.current);
      lastBomb.current = Boolean(data.pendingBomb);
      setHand(nextHand);
      setSelectedIds((ids) => ids.filter((id) => nextHand.some((card) => card.id === id)));
      setPendingBomb(data.pendingBomb || null);
      setPendingCombo(data.pendingCombo || null);
      if (data.peek) {
        setPeek(data.peek);
        window.clearTimeout(peekTimer.current);
        peekTimer.current = window.setTimeout(() => setPeek(null), 8000);
      }
    });
    connection.on('connect_error', (error) => onGameNotice?.(error.message === 'AUTH_REQUIRED' ? 'Phiên đăng nhập đã hết hạn.' : 'Mất kết nối với bàn chơi.'));
    connection.connect();
    setSocket(connection);
    return () => { connection.removeAllListeners(); connection.disconnect(); window.clearTimeout(dealTimer.current); window.clearTimeout(flightTimer.current); window.clearTimeout(peekTimer.current); window.clearTimeout(shuffleTimer.current); };
  }, [room?.code, onGameNotice]);

  function request(event, payload, done = () => {}) {
    if (!socket?.connected || busy) return;
    setBusy(true);
    socket.emit(event, { code: room?.code, ...payload }, (result) => {
      setBusy(false);
      if (!result?.ok) {
        localPlayRef.current = false;
        if (result?.code === 'CARD_NOT_FOUND') {
          setSelectedIds([]); setTargetId(null); setNamedCardKey(''); setDiscardCardId('');
          onGameNotice?.('Bài trên tay vừa thay đổi. Hãy chọn lại lá bài nhé.');
        } else onGameNotice?.(result?.error || 'Không thể thực hiện thao tác.');
      }
      else done(result);
    });
  }

  function toggleCard(card) {
    setSelectedIds((current) => current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id]);
    setTargetId(null); setNamedCardKey(''); setDiscardCardId('');
  }
  function playSelected() {
    if (!socket?.connected || busy) return;
    const playingNope = chosenCard?.key === 'nope' && Boolean(game?.pendingAction);
    if (!playValid || (!isMyTurn && !playingNope)) return;
    if (selectedIds.some((id) => !hand.some((card) => card.id === id))) {
      setSelectedIds([]); setTargetId(null); setNamedCardKey(''); setDiscardCardId('');
      onGameNotice?.('Bài trên tay vừa thay đổi. Hãy chọn lại lá bài nhé.');
      return;
    }
    if ((chosenCard.key === 'favor' || pairCombo || tripleCombo) && !targetId) { onGameNotice?.('Chọn người chơi để dùng lá này.'); return; }
    if (tripleCombo && !namedCardKey) { onGameNotice?.('Chọn tên lá bài muốn gọi.'); return; }
    if (fiveCombo && !discardCardId) { onGameNotice?.('Chọn lá bài muốn lấy từ chồng bài bỏ.'); return; }
    localPlayRef.current = true;
    request('game:play', { cardIds: selectedCards.map((card) => card.id), targetUserId: targetId, namedCardKey, discardCardId }, (result) => {
      const key = chosenCard?.key;
      playSfx(key === 'skip' ? 'skip' : key === 'attack' ? 'attack' : key === 'nope' ? 'nope' : 'play', soundRef.current);
      localPlayRef.current = false;
      if (result.private?.comboChooserId === userId && result.private?.comboChoice) setPendingCombo(result.private.comboChoice);
      setFlightCards(selectedCards.map((card, index) => ({ id: card.id, image: cardInfo(card)?.image, index })));
      window.clearTimeout(flightTimer.current);
      flightTimer.current = window.setTimeout(() => setFlightCards([]), 900);
      setSelectedIds([]); setTargetId(null); setNamedCardKey(''); setDiscardCardId('');
    });
  }

  const discard = cards[game?.discardTop];
  const currentPlayer = game?.players.find((player) => player.userId === game.currentPlayerId);
  const pending = game?.pendingBombUserId === userId;
  const secondsLeft = game?.turnDeadline ? Math.max(0, Math.ceil((game.turnDeadline - clockNow) / 1000)) : 15;
  const bombPileCount = game?.drawPileCount ?? 0;
  const chosenBombPosition = Math.min(bombPosition ?? Math.floor(bombPileCount / 2), bombPileCount);

  return (
    <section className="table live-game-table">
      <header>
        <button className="circle" onClick={onHome} aria-label="Về menu"><Home /></button>
        <div className="table-brand"><i>✦</i><b>{gameName}<small>{room?.code ?? 'ĐANG KẾT NỐI'} • VÁN TRỰC TUYẾN</small></b></div>
        <div className="tools"><button className="circle" onClick={onToggleSound} aria-label={sound ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh'} aria-pressed={sound}>{sound ? <Volume2 /> : <VolumeX />}</button><button className={`circle ${music ? '' : 'muted'}`} onClick={onToggleMusic} aria-label={music ? 'Tắt nhạc nền' : 'Bật nhạc nền'} aria-pressed={music}><Music2 /></button><button className="circle" onClick={onSettings} aria-label="Cài đặt"><Settings /></button></div>
      </header>

      <section className={`felt live-felt ${showVictory ? 'victory-rumble' : ''}`}>
        {tablePlayers.map((player, index) => { const point = seatPoint(index, tablePlayers.length); return <article key={player.userId} className={`live-seat ${player.userId === userId ? 'is-self' : ''} ${!player.alive ? 'player-out' : ''}`} style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -50%)' }}><span className={`lobby-avatar av${index % 6}`}>{player.username.slice(0, 1).toLocaleUpperCase()}</span><b>{player.username}{player.userId === userId ? ' · Bạn' : player.isHost ? ' ✦' : ''}</b><small>{player.alive ? 'Còn trong ván' : 'Đã bị loại'}</small>{player.userId === game?.currentPlayerId && <em>LƯỢT ĐANG CHƠI</em>}</article>; })}
        {dealing && <div className="deal-animation" aria-hidden="true">{dealCards.map((card) => <span key={card.id} className="deal-flight-card" style={{ '--target-x': `${card.x}%`, '--target-y': `${card.y}%`, animationDelay: `${card.delay}ms` }} />)}</div>}
        {flightCards.length > 0 && <div className="play-flight-animation" aria-hidden="true">{flightCards.map((card) => <img key={card.id} src={card.image} alt="" className="play-flight-card" style={{ '--fan-offset': `${(card.index - (flightCards.length - 1) / 2) * 24}px`, '--flight-delay': `${card.index * 85}ms` }} />)}</div>}
        <div className="live-center">
          <div className={`turn-label ${game?.pendingAction ? 'nope-window' : ''}`}>{!game ? 'ĐANG CHIA BÀI…' : game.pendingAction ? `NOPE?　${game.players.find((player) => player.userId === game.pendingAction.actorUserId)?.username ?? 'Người chơi'} đang đánh ${game.pendingAction.cardKeys.map((key) => cards[key]?.name ?? key).join(' + ')}　·　${secondsLeft}s` : isMyTurn ? `●　LƯỢT CỦA BẠN　·　⏱ ${secondsLeft}s` : `●　LƯỢT ${currentPlayer?.username ?? 'ĐANG CHỜ'}${currentPlayer ? `　·　${secondsLeft}s` : ''}`}</div>
          <div className="live-piles">
            <button className={`deck-stack live-deck ${isMyTurn && !busy ? 'deck-enabled' : ''} ${shuffling ? 'is-shuffling' : ''}`} onClick={() => request('game:draw')} disabled={!isMyTurn || busy || !game?.drawPileCount} aria-label="Rút bài"><span className="deck-layer layer-three" /><span className="deck-layer layer-two" /><span className="deck-layer layer-one" /><span className="deck-front"><b>✦</b><strong>{game?.drawPileCount ?? '—'}</strong><small>LÁ CÒN LẠI</small></span></button>
            <div className="discard-pile"><small>BÀI ĐÃ ĐÁNH</small>{discard ? <img className="discard-image" src={discard.image} alt={discard.name} /> : <div className="empty-discard">Chưa có bài bỏ</div>}</div>
          </div>
          {game?.pendingTurns > 0 && <span className="attack-turns">⚡ Bạn còn {game.pendingTurns} lượt</span>}
          <small>{game?.pendingAction ? 'Chọn lá Nope trong tay và nhấn “Chặn hành động” trước khi thời gian hết.' : isMyTurn ? 'Đánh lá phù hợp hoặc rút bài để kết thúc lượt.' : game ? `Đang chờ ${currentPlayer?.username ?? 'người chơi'} thao tác.` : 'Đang kết nối máy chủ và nhận bài.'}</small>
        </div>
        <footer><span>{game?.players.filter((player) => player.alive).length ?? 0} người còn sống</span><span>MÃ PHÒNG　<b>{room?.code}</b></span></footer>
      </section>

      {pending && <div className="bomb-prompt"><div><b>💣 Bạn rút trúng Mèo Nổ!</b><span>Gỡ Bom xong, bí mật đặt lại lá bom vào chồng rút.</span></div><div className="bomb-positions"><button onClick={() => request('game:reinsert', { position: Math.floor(Math.random() * (bombPileCount + 1)) })}>Đặt ngẫu nhiên</button><label className="bomb-position-input"><span>Vị trí từ trên (0–{bombPileCount})</span><div><input type="number" min="0" max={bombPileCount} value={chosenBombPosition} onChange={(event) => setBombPosition(Math.max(0, Math.min(bombPileCount, Number(event.target.value) || 0)))} /><button onClick={() => request('game:reinsert', { position: chosenBombPosition })}>Đặt vị trí</button></div></label><button onClick={() => request('game:reinsert', { position: bombPileCount })}>Dưới cùng</button></div></div>}
      {pendingCombo && <div className="combo-choice-overlay"><section className="combo-choice-modal"><span className="combo-choice-icon">{pendingCombo.kind === 'offer' ? '🎁' : '🃏'}</span><h2>{pendingCombo.kind === 'offer' ? pendingCombo.source === 'pair' ? 'Combo 2 lá mèo: chọn một lá để đưa' : 'Favor: chọn một lá để đưa' : 'Combo 3 lá: chọn một lá úp'}</h2><p>{pendingCombo.kind === 'offer' ? `Bạn chọn một lá trên tay để đưa cho ${game?.players.find((player) => player.userId === pendingCombo.actorUserId)?.username ?? 'đối thủ'}.` : `Đối thủ xòe ${pendingCombo.cardIds?.length ?? 0} lá úp. Chọn một lá để lấy.`}</p><div className={`combo-choice-cards ${pendingCombo.kind === 'offer' ? 'offer-cards' : 'pick-cards'}`}>{pendingCombo.kind === 'offer' ? hand.map((card) => { const info = cardInfo(card); return info ? <button key={card.id} className="combo-offer-card" onClick={() => request('game:combo-choose', { cardId: card.id })} disabled={busy}><img src={info.image} alt={info.name} /><small>Đưa lá này</small></button> : null; }) : (pendingCombo.cardIds || []).map((cardId, index) => <button key={cardId} className="combo-hidden-card" onClick={() => request('game:combo-choose', { cardId })} disabled={busy} aria-label={`Chọn lá úp ${index + 1}`}><span>✦</span></button>)}</div></section></div>}
      {peek && <div className="peek-overlay" role="status" aria-live="polite"><div className="peek-modal"><div className="peek-heading"><span>🔮</span><div><b>Ba lá tiếp theo</b><small>Chỉ bạn nhìn thấy · tự úp sau 8 giây</small></div><button className="peek-close" onClick={() => { window.clearTimeout(peekTimer.current); setPeek(null); }}>Đóng</button></div><div className="peek-cards">{peek.map((key, index) => { const info = cards[key]; return <div className="peek-card-slot" key={`${key}-${index}`} style={{ '--peek-index': index }}><div className="peek-card-flipper"><div className="peek-card-back"><span>✦</span></div><div className="peek-card-front">{info && <><img src={info.image} alt={info.name} /><b>{info.name}</b></>}</div></div></div>; })}</div><div className="peek-progress"><i /></div></div></div>}
      {showVictory && <div className="victory-overlay" role="dialog" aria-modal="true" aria-label="Chúc mừng chiến thắng"><div className="victory-fireworks" aria-hidden="true">{Array.from({ length: 76 }, (_, index) => { const angle = index * 2.399; const distance = 70 + (index * 37) % 190; return <i key={index} style={{ left: `${8 + (index * 47) % 84}%`, top: `${12 + (index * 31) % 72}%`, '--burst-x': `${Math.cos(angle) * distance}px`, '--burst-y': `${Math.sin(angle) * distance}px`, '--spark-delay': `${(index % 18) * 0.075}s`, '--spark-hue': `${(index * 43) % 360}` }} />; })}</div><section className="victory-card"><span className="victory-crown">♛</span><small>VÁN ĐẤU KẾT THÚC</small><h1>🎉 Chúc mừng! 🎉</h1><p><b>{game?.players.find((player) => player.userId === game.winnerId)?.username ?? 'Người chơi'}</b> là người chiến thắng!</p><div className="victory-confetti">✦　🎊　✦　🎊　✦</div><button className="primary" onClick={() => setShowVictory(false)}>Tuyệt quá!</button></section></div>}
      {chosenCard && <aside className="card-detail live-card-detail"><img src={chosenInfo?.image} alt={chosenInfo?.name} /><div><span>{selectedCards.length > 1 ? `${selectedCards.length} LÁ ĐANG CHỌN` : 'CHỨC NĂNG LÁ BÀI'}</span><h3>{comboTitle}</h3><p>{playValid ? comboMessage : selectedCards.length > 1 ? 'Có thể đánh từng lá chức năng trong cùng lượt; combo chỉ hợp lệ với 2/3 lá mèo cùng loại hoặc 5 lá khác loại.' : comboMessage || 'Lá mèo cần ghép combo mới dùng được.'}</p>{(chosenCard.key === 'favor' || pairCombo || tripleCombo) && <div className="target-picker">{tablePlayers.filter((player) => player.alive && player.userId !== userId).map((player) => <button key={player.userId} className={targetId === player.userId ? 'target-selected' : ''} onClick={() => setTargetId(player.userId)}>{player.username}</button>)}</div>}{fiveCombo && <select className="combo-select" value={discardCardId} onChange={(event) => setDiscardCardId(event.target.value)}><option value="">Chọn bài trong chồng bỏ</option>{[...(game?.discardCards ?? []), ...selectedCards].map((card) => <option key={card.id} value={card.id}>{cards[card.key]?.name ?? card.key}{selectedIds.includes(card.id) ? ' (lá vừa đánh)' : ''}</option>)}</select>}<button className="primary" onClick={playSelected} disabled={(!isMyTurn && !(chosenCard.key === 'nope' && game?.pendingAction)) || busy || !playValid}>{busy ? 'Đang xử lý…' : chosenCard.key === 'nope' && game?.pendingAction ? 'Chặn hành động' : isMyTurn ? selectedCards.length > 1 ? 'Đánh combo' : 'Đánh lá này' : 'Chưa tới lượt'} <ArrowRight size={15} /></button></div></aside>}

      <section className={`hand live-hand ${dealing ? 'is-dealing' : ''}`}><div className="hand-title">BÀI CỦA {me?.username?.toLocaleUpperCase() ?? 'BẠN'}　<b>{hand.length}</b><span>{dealing ? <small className="dealing-label">ĐANG CHIA BÀI…</small> : <button onClick={() => setGuideOpen(true)}><CircleHelp size={14} /> Hướng dẫn</button>}</span></div><div className={`cards ${hand.length > 7 ? 'many-cards' : ''}`}>{hand.map((card) => { const info = cardInfo(card); return info ? <button key={card.id} className={`playing-card asset-card ${selectedIds.includes(card.id) ? 'chosen' : ''}`} onClick={() => toggleCard(card)} aria-pressed={selectedIds.includes(card.id)} aria-label={`Chọn ${info.name}`}><img src={info.image} alt={info.name} /></button> : null; })}</div><div className="actions"><button className="secondary" onClick={() => request('game:draw')} disabled={!isMyTurn || busy}>↧　Bốc bài</button><span>{game?.status === 'finished' ? `Người thắng: ${game.players.find((player) => player.userId === game.winnerId)?.username ?? ''}` : isMyTurn ? 'Đánh lá/ combo rồi rút bài trước khi hết giờ' : 'Đang chờ lượt'}</span></div></section>
      {guideOpen && <RulesGuide onClose={() => setGuideOpen(false)} />}
    </section>
  );
}
