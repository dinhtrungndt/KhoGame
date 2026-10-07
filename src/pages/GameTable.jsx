import React from 'react';
import { ArrowRight, CircleHelp, Home, Music2, Settings, Volume2, VolumeX } from 'lucide-react';
import { demoHand } from '../data/cards.js';

export default function GameTable({
  room,
  gameName,
  sound,
  music,
  onToggleSound,
  onToggleMusic,
  onHome,
  onHelp,
  onSettings,
  onDraw,
  onPlayCard,
  selectedCard,
  onEndTurn,
}) {
  return (
    <section className="table">
      <header>
        <button className="circle" onClick={onHome} aria-label="Về menu"><Home /></button>
        <div className="table-brand">
          <i>✦</i>
          <b>{gameName}<small>PHÒNG CHỜ • BẢN XEM TRƯỚC</small></b>
        </div>
        <div className="tools">
          <button className="circle" onClick={onToggleSound} aria-label="Âm thanh">
            {sound ? <Volume2 /> : <VolumeX />}
          </button>
          <button className="circle" onClick={onToggleMusic} aria-label="Nhạc nền">
            <Music2 />
          </button>
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
            <button className="deck" onClick={onDraw} aria-label="Bốc bài">
              <b>✦</b><strong>BỐC BÀI</strong><small>Rút 1 lá</small>
            </button>
            <div><small>BÀI ĐÃ ĐÁNH</small><img className="discard-image" src={demoHand[0].image} alt={demoHand[0].name} /></div>
          </div>
          <small>Chọn bài để đánh hoặc bốc bài để kết thúc lượt</small>
        </div>
        <footer>●　Đang chờ người chơi <span>MÃ PHÒNG　<b>{room?.code ?? 'MEO-2048'}</b></span></footer>
      </section>

      <section className="hand">
        <div className="hand-title">BÀI CỦA BẠN　<b>{demoHand.length}</b><span><button onClick={onHelp}><CircleHelp size={14} /> Hướng dẫn</button></span></div>
        <div className="cards">
          {demoHand.map((card, index) => (
            <button
              key={`${card.name}-${index}`}
              className={`playing-card asset-card ${selectedCard === index ? 'chosen' : ''}`}
              onClick={() => onPlayCard(index)}
              aria-label={`Chọn lá ${card.name}`}
            >
              <img src={card.image} alt={card.name} />
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="secondary" onClick={onDraw}>↧　Bốc bài</button>
          <button className="primary" onClick={onEndTurn}>Kết thúc lượt <ArrowRight size={16} /></button>
        </div>
      </section>
    </section>
  );
}
