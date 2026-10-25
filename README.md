# Thiệp cưới Ngọc & Thủy

React, TypeScript và Vite; xuất website tĩnh lên [Cloudflare Static Assets](https://ngoc-thuy-wedding.ngoc-nv0410.workers.dev/).

```sh
npm ci
npm run dev
npm test
npm run build
```

Nội dung thiệp nằm trong `src/content/wedding.ts`; thông tin mừng cưới ở `src/content/accounts.json`.

## Triển khai Cloudflare

Project hiện tại là Worker `ngoc-thuy-wedding`, chỉ phục vụ thư mục `dist`; không có Worker script hoặc API server. Cấu hình trong `wrangler.jsonc`.

Kết nối repository với Cloudflare, chọn nhánh `main`, build command `npm run build:cloudflare`, deploy command `npm run deploy:cloudflare`. Đặt Firebase config trong **Settings → Build → Build variables and secrets**. Không commit giá trị vào repository. Xem [hướng dẫn Cloudflare và danh sách biến](docs/CLOUDFLARE.md).

GitHub Actions chỉ chạy kiểm tra, không tự triển khai GitHub Pages nữa. Bản GitHub Pages đã xuất bản trước đây vẫn còn trong lúc chuyển link.

## Lời chúc với Firebase Firestore

Khách có thể gửi tên và lời chúc trực tiếp từ trình duyệt; danh sách cập nhật theo thời gian thực. Không cần server riêng hoặc Cloud Functions. Firebase SDK chỉ tải khi khách đến gần phần lời chúc.

Xem [hướng dẫn cấu hình Firebase, Firestore Rules và chạy thử](docs/FIREBASE.md).

Mục lời chúc chỉ công khai khi có biến môi trường `VITE_FIREBASE_*` và `firebaseGuestbookReady = true` trong `src/content/firebase.ts`, sau khi database, Rules và Anonymous Auth đã sẵn sàng. Chạy local: copy `.env.example` sang `.env.local` và điền giá trị. `VITE_*` được đưa vào JavaScript khi build, vì vậy Secret trên Cloudflare không biến Firebase Web config thành khóa bí mật ở trình duyệt. Không đưa service-account key vào frontend.

```sh
# Tự khởi động emulator, kiểm tra quyền và tắt emulator sau khi xong.
npm run test:rules
```
