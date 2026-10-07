import React, { useState } from 'react';
import { ArrowRight, CircleHelp, Home, Music2, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { demoHand } from '../data/cards.js';
import RulesGuide from './RulesGuide.jsx';

function validatePlay(selection) {
  if (!selection.length) return { valid: false, title: 'Chọn lá bài', message: 'Chọn một lá để xem chức năng.' };
  if (selection.length === 1) {
    const card = selection[0];
    if (card.name === 'Defuse') return { valid: false, title: card.name, message: 'Gỡ Bom chỉ dùng ngay khi bạn rút trúng Mèo Nổ.' };
    if (card.category === 'cat') return { valid: false, title: card.name, message: 'Lá mèo không có tác dụng khi đánh một mình. Hãy ghép combo.' };
    return { valid: true, type: 'action', title: card.name, message: card.description };
  }
  const sameCatPair = selection.every((card) => card.category === 'cat' && card.name === selection[0].name);
  if (selection.length === 2 && sameCatPair) {
    return { valid: true, type: 'pair', title: 'Combo: 2 lá cùng loại', message: 'Chọn một người chơi để lấy ngẫu nhiên một lá bài.' };
  }
  if (selection.length === 3 && sameCatPair) {
    return { valid: true, type: 'triple', title: 'Combo: 3 lá cùng loại', message: 'Chọn người chơi và gọi tên lá muốn lấy. Nếu họ có lá đó, họ phải đưa cho bạn.' };
  }
  if (selection.length === 5 && new Set(selection.map((card) => card.name)).size === 5) {
    return { valid: true, type: 'five', title: 'Combo: 5 lá khác loại', message: 'Chọn một lá từ chồng bài bỏ.' };
  }
  return { valid: false, title: 'Combo chưa hợp lệ', message: 'Ghép 2 hoặc 3 lá mèo cùng loại, hoặc chọn 5 lá khác loại.' };
}

export default function GameTable({ room, gameName, sound, music, onToggleSound, onToggleMusic, onHome, onSettings, onDraw, onPlayCard }) {
  const [hand, setHand] = useState(demoHand);
  const [discard, setDiscard] = useState(demoHand[0]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [drawingCard, setDrawingCard] = useState(null);
  const [playedCard, setPlayedCard] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const selectedCards = selectedIndices.map((index) => hand[index]).filter(Boolean);
  const playStatus = validatePlay(selectedCards);

  function drawCard() {
    const next = demoHand[Math.floor(Math.random() * demoHand.length)];
    setDrawing(true);
    setDrawingCard(next);
    setHand((current) => [...current, next]);
    setSelectedIndices([]);
    window.setTimeout(() => { setDrawing(false); setDrawingCard(null); }, 720);
    onDraw();
  }

  function selectCard(index) {
    setSelectedIndices((current) => current.includes(index)
      ? current.filter((selected) => selected !== index)
      : [...current, index]);
  }

  function playSelectedCards() {
    if (!playStatus.valid || playedCard) return;
    const cardsToPlay = [...selectedCards];
    const indicesToRemove = new Set(selectedIndices);
    setPlayedCard(cardsToPlay[0]);
    window.setTimeout(() => {
      setDiscard(cardsToPlay[cardsToPlay.length - 1]);
      setHand((current) => current.filter((_, index) => !indicesToRemove.has(index)));
      setSelectedIndices([]);
      setPlayedCard(null);
      onPlayCard({ cards: cardsToPlay, type: playStatus.type });
    }, 640);
  }

  return (
    <section className="table">
      <header>
        <button className="circle" onClick={onHome} aria-label="Về menu"><Home /></button>
        <div className="table-brand"><i>✦</i><b>{gameName}<small>PHÒNG CHỜ • BẢN XEM TRƯỚC</small></b></div>
        <div className="tools">
          <button className="circle" onClick={onToggleSound} aria-label="Âm thanh">{sound ? <Volume2 /> : <VolumeX />}</button>
          <button className="circle" onClick={onToggleMusic} aria-label="Nhạc nền"><Music2 /></button>
          <button className="circle" onClick={onSettings} aria-label="Cài đặt"><Settings /></button>
        </div>
      </header>

      <section className="felt">
        <div className="seat top"><i>M</i><span><b>Mèo Máy</b><small>4 lá trên tay</small></span><em>▰ ▰ ▰</em></div>
        <div className="seat left"><i>K</i><span><b>Khách Mời</b><small>5 lá trên tay</small></span><em>▰ ▰ ▰</em></div>
        <div className="seat right"><i>L</i><span><b>LuckyCat</b><small>4 lá trên tay</small></span><em>▰ ▰ ▰</em></div>
        <div className="center-table">
          <label>●　LƯỢT CỦA BẠN</label>
          <div className="piles">
            <button className={`deck-stack ${drawing ? 'is-drawing' : ''}`} onClick={drawCard} aria-label="Rút một lá bài">
              <span className="deck-layer layer-three" /><span className="deck-layer layer-two" /><span className="deck-layer layer-one" />
              <span className="deck-front"><b>✦</b><strong>BỐC BÀI</strong><small>Rút 1 lá</small></span>
            </button>
            <div className="discard-pile"><small>BÀI ĐÃ ĐÁNH</small><img className="discard-image" src={discard.image} alt={discard.name} /></div>
          </div>
          <small>Chọn bài để đánh hoặc bốc bài để kết thúc lượt</small>
        </div>
        <footer>●　Đang chờ người chơi <span>MÃ PHÒNG　<b>{room?.code ?? 'MEO-2048'}</b></span></footer>
        {drawing && drawingCard && <img className="draw-flight" src={drawingCard.image} alt={`Đang rút ${drawingCard.name}`} />}
        {playedCard && <img className="play-flight" src={playedCard.image} alt={`Đang đánh ${playedCard.name}`} />}
      </section>

      {selectedCards.length > 0 && (
        <aside className="card-detail">
          <button className="detail-close" onClick={() => setSelectedIndices([])} aria-label="Đóng mô tả"><X size={15} /></button>
          <img src={selectedCards[0].image} alt={selectedCards[0].name} />
          <div>
            <span>{selectedCards.length > 1 ? `${selectedCards.length} LÁ ĐANG CHỌN` : 'CHỨC NĂNG LÁ BÀI'}</span>
            <h3>{playStatus.title}</h3>
            <p>{playStatus.message}</p>
            <button className="primary" onClick={playSelectedCards} disabled={!playStatus.valid || Boolean(playedCard)}>
              {playStatus.valid ? 'Đánh bài' : 'Chưa thể đánh'} <ArrowRight size={15} />
            </button>
          </div>
        </aside>
      )}

      <section className="hand">
        <div className="hand-title">BÀI CỦA BẠN　<b>{hand.length}</b><span><button onClick={() => setGuideOpen(true)}><CircleHelp size={14} /> Hướng dẫn</button></span></div>
        <div className="cards">
          {hand.map((card, index) => (
            <button key={`${card.name}-${index}`} className={`playing-card asset-card ${selectedIndices.includes(index) ? 'chosen' : ''}`} onClick={() => selectCard(index)} aria-pressed={selectedIndices.includes(index)} aria-label={`Chọn ${card.name}`}>
              <img src={card.image} alt={card.name} />
            </button>
          ))}
        </div>
        <div className="actions"><button className="secondary" onClick={drawCard}>↧　Bốc bài</button><button className="primary" onClick={drawCard}>Rút bài kết thúc lượt <ArrowRight size={16} /></button></div>
      </section>
      {guideOpen && <RulesGuide onClose={() => setGuideOpen(false)} />}
    </section>
  );
}
