const fs = require('fs');
let text = fs.readFileSync('src/Rooms.jsx', 'utf8');

const regex = /function RoomOptions[\s\S]*?<\/div>\s*\}\s*/;
const replacement = unction RoomOptions({ onCreate, onFind, onQuickJoin, loading, message, selectedGame }) {
  return <>
    <div className="rooms-intro"><label className="kicker">CHỌN CÁCH CHƠI</label><h1>Sẵn sàng vào bàn?</h1><p>Tạo phòng riêng, tìm bàn chơi hoặc vào nhanh phòng còn chỗ.</p></div>
    <div className="room-options">
      <Option icon={<Plus />} title="Tạo phòng" text="Chọn số người và thiết lập bàn chơi." onClick={onCreate} />
      <Option icon={<Search />} title="Tìm phòng" text={\Xem các phòng \ đang chờ người chơi.\} onClick={onFind} tone="blue" />
      <Option icon={<RefreshCw />} title="Vào ngay" text={loading ? 'Đang tìm phòng trống…' : 'Vào ngẫu nhiên một phòng công khai còn chỗ.'} onClick={onQuickJoin} tone="gold" disabled={loading} />
    </div>
  </>;
}\n;

text = text.replace(regex, replacement);
fs.writeFileSync('src/Rooms.jsx', text, 'utf8');
