# Thiệp cưới Ngọc & Thủy

React, TypeScript và Vite; xuất website tĩnh lên [GitHub Pages](https://ngocnv0410.github.io/ngoc-thuy-wedding/).

```sh
npm ci
npm run dev
npm test
npm run build
```

Nội dung thiệp nằm trong `src/content/wedding.ts`; thông tin mừng cưới ở `src/content/accounts.json`.

## Nhạc theo liên kết

Link thường dùng bản nhạc trong `wedding.ts`. Thêm `?music=youtube` (hoặc `&music=youtube` nếu đã có `?v=…`) để dùng `public/audio/youtube-hGu7BVQy5G0.mp3`, bắt đầu và lặp lại từ giây 15. Nút “Chia sẻ thiệp” giữ lựa chọn này khi gửi tiếp. Cả hai bản chỉ tải/phát sau thao tác bật nhạc của khách.

## Lời chúc với Firebase Firestore

Khách có thể gửi tên và lời chúc trực tiếp từ trình duyệt; danh sách cập nhật theo thời gian thực. Không cần server riêng hoặc Cloud Functions. Firebase SDK chỉ tải khi khách đến gần phần lời chúc.

Xem [hướng dẫn cấu hình Firebase, Firestore Rules và chạy thử](docs/FIREBASE.md).

Mục lời chúc chỉ công khai khi có Firebase Web config và `firebaseGuestbookReady = true` trong `src/content/firebase.ts`, sau khi database, Rules và Anonymous Auth đã sẵn sàng. API key chỉ lấy từ **Repository Secret `VITE_FIREBASE_API_KEY`** khi deploy GitHub Pages; không ghi khóa vào source. Chạy local dùng `.env.local` theo `.env.example`. Các định danh project công khai vẫn nằm trong file cấu hình; không đưa service-account key vào frontend.

Workflow chạy `npm run check:secrets` để chặn Google API key ghi trực tiếp trong file được Git theo dõi. Firebase Web key vẫn xuất hiện trong JavaScript sau khi build; cần giới hạn API/domain và giữ Firestore Rules. Xem [hướng dẫn xử lý cảnh báo và thay khóa](docs/API-KEY-SECURITY.md).

```sh
# Tự khởi động emulator, kiểm tra quyền và tắt emulator sau khi xong.
npm run test:rules
```
