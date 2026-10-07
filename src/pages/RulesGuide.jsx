import React from 'react';
import { ArrowRight, X } from 'lucide-react';

const cardRules = [
  ['Attack', 'Kết thúc lượt không rút bài; người kế tiếp chịu hai lượt.'],
  ['Skip', 'Kết thúc lượt hiện tại không rút. Khi chịu Attack, mỗi Skip bỏ một lượt.'],
  ['Nope', 'Chặn hành động vừa được chơi (trừ Mèo Nổ và Gỡ Bom); một Nope khác có thể chặn lại.'],
  ['Favor', 'Người được chọn tự đưa một lá trên tay cho bạn.'],
  ['Shuffle', 'Xào lại chồng bài rút.'],
  ['See the Future', 'Bí mật xem ba lá trên cùng rồi đặt lại đúng thứ tự.'],
  ['Defuse', 'Gỡ Mèo Nổ vừa rút và đặt lá đó bí mật trở lại chồng rút.'],
];

export default function RulesGuide({ onClose }) {
  return (
    <div className="guide-scrim" onClick={onClose}>
      <aside className="guide-panel" onClick={(event) => event.stopPropagation()}>
        <header><div><span className="guide-kicker">MÈO NỔ • LUẬT CƠ BẢN</span><h2>Hướng dẫn chơi</h2></div><button onClick={onClose} aria-label="Đóng hướng dẫn"><X /></button></header>
        <div className="guide-content">
          <section className="guide-section objective"><span className="guide-number">01</span><div><h3>Mục tiêu</h3><p>Tránh rút Mèo Nổ. Người cuối cùng còn lại trong ván là người thắng.</p></div></section>
          <section className="guide-section"><span className="guide-number">02</span><div><h3>Trong lượt của bạn</h3><p>Bạn có thể đánh các lá chức năng muốn dùng. Nếu không có lá kết thúc lượt, hãy rút một lá để kết thúc lượt.</p><p>Skip kết thúc lượt không rút. Khi chịu Attack, một Skip chỉ bỏ một lượt. Attack chuyển hai lượt sang người kế tiếp; nếu họ đánh Attack, lượt còn lại được chuyển tiếp và cộng thêm hai lượt.</p></div></section>
          <section className="guide-section"><span className="guide-number">03</span><div><h3>Khi rút Mèo Nổ</h3><p>Dùng Gỡ Bom để sống sót và đặt Mèo Nổ trở lại chồng rút ở vị trí bí mật. Nếu không có Gỡ Bom, bạn bị loại.</p></div></section>
          <section className="guide-section"><span className="guide-number">04</span><div><h3>Lá chức năng</h3><ul>{cardRules.map(([name, text]) => <li key={name}><b>{name}</b><span>{text}</span></li>)}</ul></div></section>
          <section className="guide-section"><span className="guide-number">05</span><div><h3>Combo mèo</h3><p>Hai lá mèo cùng loại: lấy ngẫu nhiên một lá của người chơi khác. Ba lá cùng loại: gọi tên lá muốn lấy; năm lá khác loại: chọn một lá từ chồng bỏ.</p></div></section>
          <p className="guide-note">Bản hiện tại là luật cơ bản dựa theo bộ bài đã chọn. Các lá mở rộng sẽ được thêm sau.</p>
        </div>
        <button className="guide-done" onClick={onClose}>Đã hiểu <ArrowRight size={16} /></button>
      </aside>
    </div>
  );
}
