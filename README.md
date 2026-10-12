# Kho Game

Kho Game là frontend web/PWA tiếng Việt cho nền tảng chơi game trực tuyến. Ứng dụng được xây dựng bằng React và Vite, hỗ trợ giao diện responsive, phòng chơi realtime, chat văn bản, voice chat và hai trò chơi:

- **Mèo Nổ (Exploding Kittens)**: 3–10 người chơi.
- **UNO**: 2–10 người chơi.

Repository này **chỉ chứa frontend**. Để đăng nhập, tạo phòng và chơi online, cần có backend tương thích với REST API, Socket.IO và cơ chế session cookie mà frontend đang sử dụng.

## Tính năng

- Đăng nhập, đăng ký và tự động khôi phục session.
- Quên mật khẩu và đặt lại mật khẩu bằng token trên URL.
- Lobby chọn trò chơi.
- Tạo phòng, tìm phòng, vào phòng bằng mã và vào nhanh phòng công khai.
- Phòng riêng có mật khẩu, chọn số người chơi và sao chép mã mời.
- Phòng chờ realtime với trạng thái người chơi, ghế, host và trạng thái sẵn sàng.
- Bàn chơi realtime cho Mèo Nổ và UNO.
- Chat văn bản trong phòng/bàn.
- Voice chat peer-to-peer bằng WebRTC.
- Hiệu ứng âm thanh và nhạc nền tạo bằng Web Audio API.
- Cài đặt như ứng dụng PWA trên thiết bị hỗ trợ.
- Giao diện ưu tiên màn hình ngang nhưng vẫn responsive cho mobile.

## Công nghệ

- React 19 và React DOM.
- Vite 8.
- JavaScript/JSX.
- Socket.IO Client cho realtime.
- WebRTC cho voice chat.
- Lucide React cho icon.
- Web Audio API cho âm thanh.
- Web App Manifest và Service Worker cho PWA.

## Yêu cầu

- Node.js phiên bản LTS hiện hành.
- npm hoặc pnpm.
- Backend Kho Game đang chạy và cho phép frontend truy cập.
- HTTPS khi chạy voice chat trên môi trường không phải `localhost`.

Lockfile của repository là `pnpm-lock.yaml`, vì vậy pnpm được khuyến nghị:

```bash
corepack enable
pnpm install
```

Có thể dùng npm nếu cần:

```bash
npm install
```

## Cấu hình môi trường

Tạo file `.env` ở thư mục gốc, có thể bắt đầu từ `.env.example`:

```env
VITE_API_URL=http://localhost:1151/api
```

`VITE_API_URL` là URL gốc của REST API. Frontend dùng cùng host đó để kết nối Socket.IO sau khi bỏ phần `/api`.

Ví dụ:

| `VITE_API_URL` | REST API | Socket.IO host |
| --- | --- | --- |
| `http://localhost:1151/api` | `http://localhost:1151/api` | `http://localhost:1151` |
| `https://api.example.com/api` | `https://api.example.com/api` | `https://api.example.com` |

Nếu không khai báo biến môi trường, code hiện có fallback về `http://localhost:4000/api`. Không đưa secret của backend vào biến `VITE_*`, vì các biến này được đóng gói vào JavaScript phía client.

## Chạy dự án

### Môi trường phát triển

```bash
pnpm dev
```

Hoặc:

```bash
npm run dev
```

Mở URL Vite hiển thị trong terminal, thường là `http://localhost:5173`.

### Build production

```bash
pnpm build
```

Hoặc:

```bash
npm run build
```

Lệnh build tạo các file tĩnh trong thư mục `dist/`.

### Xem thử bản build

```bash
pnpm preview
```

Hoặc:

```bash
npm run preview
```

## Luồng sử dụng chính

1. Người dùng đăng nhập hoặc đăng ký.
2. Chọn Mèo Nổ hoặc UNO tại lobby.
3. Tạo phòng, tìm phòng, vào nhanh hoặc nhập mã phòng.
4. Trong phòng chờ, người chơi bật trạng thái sẵn sàng; host bắt đầu ván.
5. Chơi tại bàn realtime, dùng chat/voice chat nếu cần.
6. Rời bàn để quay lại danh sách phòng hoặc về lobby.

## Kiến trúc frontend

`src/App.jsx` là bộ điều phối trạng thái và màn hình chính:

```text
auth -> lobby -> rooms -> roomLobby -> table
  \-> reset
```

Các module chính:

```text
src/
├── App.jsx              # Điều phối màn hình, auth, room và cài đặt
├── main.jsx             # Entry point React và đăng ký Service Worker
├── api.js               # REST API với credentials cookie
├── realtime.js          # Khởi tạo Socket.IO client
├── Rooms.jsx            # Tạo, tìm và tham gia phòng
├── RoomLobby.jsx        # Phòng chờ realtime
├── RoomChat.jsx         # Chat văn bản và điều khiển microphone
├── chatStore.js         # Store chat trong memory
├── voiceChat.js         # WebRTC voice chat
├── audio.js             # Hiệu ứng và nhạc nền bằng Web Audio API
├── unoCards.js          # Metadata và mapping ảnh bài UNO
├── data/cards.js        # Metadata bài Mèo Nổ
├── pages/
│   ├── AuthPage.jsx
│   ├── ResetPasswordPage.jsx
│   ├── LobbyPage.jsx
│   ├── GameTable.jsx    # Bàn Mèo Nổ
│   ├── UnoTable.jsx     # Bàn UNO
│   └── RulesGuide.jsx
├── assets/meono/        # Ảnh bài Mèo Nổ
├── assets/uno/          # Ảnh bài UNO
└── style.css            # Toàn bộ style responsive
```

## Backend contract

Frontend hiện gọi các REST endpoint sau:

```text
POST /auth/login
POST /auth/register
GET  /auth/me
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password

GET  /rooms?game=<game>
POST /rooms
POST /rooms/quick-join
POST /rooms/:code/join
GET  /rooms/:code
POST /rooms/:code/leave
```

Request dùng `credentials: 'include'`, nên backend cần cấu hình session cookie, CORS và `Access-Control-Allow-Credentials` phù hợp. Lỗi API được frontend kỳ vọng ở dạng `payload.error.message` và có thể có `payload.error.code`.

Socket.IO được dùng cho:

- Theo dõi danh sách phòng: `rooms:watch`, `rooms:list`.
- Phòng chờ: `room:join`, `room:state`, `room:you`, `room:ready`, `game:start`.
- Bàn game: trạng thái game, hand riêng và các action tương ứng của từng game.
- Chat: `room:chat`, `room:chat:message`.
- Voice chat: `webrtc:signal`.

Danh sách event và schema đầy đủ nằm ở backend; frontend repository hiện không chứa server hoặc tài liệu backend độc lập.

## PWA và voice chat

Ứng dụng đăng ký `public/sw.js` và dùng `public/manifest.webmanifest`. Service Worker hiện chỉ gọi `skipWaiting()` và `clients.claim()`; chưa có cache asset/API hay chế độ offline.

Voice chat cần:

- Quyền microphone từ trình duyệt.
- `localhost` hoặc HTTPS.
- Backend chuyển tiếp signaling WebRTC qua Socket.IO.
- Kết nối mạng phù hợp với STUN server đang cấu hình (`stun:stun.l.google.com:19302`).

Trình duyệt có thể chặn audio tự động phát; ứng dụng sẽ unlock audio sau tương tác đầu tiên của người dùng.

## Deploy frontend

Build và phục vụ thư mục `dist/` bằng static hosting:

```bash
pnpm install
pnpm build
```

Khi triển khai production, cần đảm bảo:

1. Build với `VITE_API_URL` trỏ tới API production.
2. Static host hỗ trợ SPA fallback về `index.html`.
3. Backend cho phép origin của frontend và credentials cookie.
4. Socket.IO dùng cùng origin hoặc được cấu hình CORS tương ứng.
5. Dùng HTTPS để microphone/WebRTC hoạt động ổn định.
6. Cấu hình TURN server nếu môi trường người dùng yêu cầu relay ngoài STUN.

Repository hiện chưa có Dockerfile, cấu hình CI/CD, cấu hình hosting cụ thể hoặc hướng dẫn chạy backend.

## Scripts

| Lệnh | Mục đích |
| --- | --- |
| `pnpm dev` / `npm run dev` | Chạy Vite development server |
| `pnpm build` / `npm run build` | Build production vào `dist/` |
| `pnpm preview` / `npm run preview` | Preview bản build production |

Hiện chưa có script test, unit test, integration test, E2E test, ESLint hoặc Prettier trong repository.

## Xử lý sự cố thường gặp

- **Không đăng nhập được hoặc không tải được phòng:** kiểm tra backend, `VITE_API_URL`, CORS và cookie session.
- **Phòng hiển thị nhưng không cập nhật realtime:** kiểm tra Socket.IO host, HTTPS/WSS và event contract với backend.
- **Không bật được microphone:** cấp quyền microphone, dùng HTTPS/localhost và kiểm tra signaling.
- **Refresh trang bị 404 sau deploy:** bật SPA fallback về `index.html`.
- **PWA không hiện nút cài đặt:** trình duyệt phải đáp ứng điều kiện installability; trên desktop/mobile, cách hiển thị prompt có thể khác nhau.

## Trạng thái dự án

Frontend đã có luồng chơi online và realtime ở mức sử dụng được với backend tương thích. Tuy nhiên repository chưa bao gồm:

- Backend, database hoặc schema dữ liệu.
- Tài khoản test và môi trường production.
- Tài liệu API/event đầy đủ.
- Automated tests.
- Cấu hình deploy/CI chính thức.
- Offline cache hoàn chỉnh cho PWA.

Vì vậy, khi phát triển tính năng mới nên kiểm tra cả REST API và Socket.IO backend tương ứng thay vì chỉ thay đổi giao diện.
