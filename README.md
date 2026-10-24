# Thiệp cưới Ngọc & Thủy

React, TypeScript và Vite; xuất website tĩnh lên [GitHub Pages](https://ngocnv0410.github.io/ngoc-thuy-wedding/).

```sh
npm ci
npm run dev
npm test
npm run build
```

Nội dung thiệp nằm trong `src/content/wedding.ts`; thông tin mừng cưới ở `src/content/accounts.json`.

## Lời chúc với Firebase Firestore

Khách có thể gửi tên và lời chúc trực tiếp từ trình duyệt; danh sách cập nhật theo thời gian thực. Không cần server riêng hoặc Cloud Functions. Firebase SDK chỉ tải khi khách đến gần phần lời chúc.

Xem [hướng dẫn cấu hình Firebase, Firestore Rules và chạy thử](docs/FIREBASE.md).

Mục lời chúc chỉ công khai khi có Firebase Web config và `firebaseGuestbookReady = true` trong `src/content/firebase.ts`, sau khi database, Rules và Anonymous Auth đã sẵn sàng. Có thể cấu hình bằng file công khai đó, hoặc biến môi trường `VITE_FIREBASE_*` theo `.env.example`. Không đưa service-account key vào frontend.

```sh
# Tự khởi động emulator, kiểm tra quyền và tắt emulator sau khi xong.
npm run test:rules
```
