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

## Build và triển khai

CI dùng một job để kiểm tra secret/cấu hình Firebase, cài dependencies từ lockfile
với npm cache, build và deploy GitHub Pages. Unit test và Firestore Rules test
chạy ở máy phát triển bằng `npm test` và `npm run test:rules`; CI không cài Java
hay chạy emulator.
Thiếu Firebase API key hoặc build lỗi vẫn dừng triển khai.

## Lời chúc với Firebase Firestore

Khách có thể gửi tên và lời chúc trực tiếp từ trình duyệt; danh sách cập nhật theo thời gian thực. Không cần server riêng hoặc Cloud Functions. Firebase SDK chỉ tải khi khách đến gần phần lời chúc.

Xem [hướng dẫn cấu hình Firebase, Firestore Rules và chạy thử](docs/FIREBASE.md).

Mục lời chúc chỉ công khai khi có Firebase Web config và `firebaseGuestbookReady = true` trong `src/content/firebase.ts`, sau khi database, Rules và Anonymous Auth đã sẵn sàng. API key chỉ lấy từ **Repository Secret `VITE_FIREBASE_API_KEY`** khi deploy GitHub Pages; không ghi khóa vào source. Chạy local dùng `.env.local` theo `.env.example`. Các định danh project công khai vẫn nằm trong file cấu hình; không đưa service-account key vào frontend.

Workflow chạy `node scripts/check-secrets.mjs` để chặn Google API key ghi trực tiếp trong file được Git theo dõi. Firebase Web key vẫn xuất hiện trong JavaScript sau khi build; cần giới hạn API/domain và giữ Firestore Rules. Xem [hướng dẫn xử lý cảnh báo và thay khóa](docs/API-KEY-SECURITY.md).

```sh
# Tự khởi động emulator, kiểm tra quyền và tắt emulator sau khi xong.
npm run test:rules
```

## Chibi và nội dung minh họa tạm

Các block dùng `ChibiStory` với động tác theo nội dung, dùng chung bộ chibi đã duyệt.
Vòng lặp chỉ chạy khi cảnh trong khung nhìn, cửa mở đầu đã đóng và tab đang hiển thị;
chế độ giảm chuyển động giữ hình tĩnh. Không tự phát nhạc.

Hai sự kiện trong `src/content/wedding.ts` đang dùng giờ **minh họa** 09:00–11:00.
Khi chốt lịch, thay giờ rồi bỏ `sampleTime`; nhãn mẫu trên thiệp và lịch xuất sẽ tự bỏ.
Giữ nguyên ngày cưới và địa điểm thật.

Album mẫu nằm ở `src/content/sample-gallery.ts`, gồm hai chương và sáu hình minh họa.
`src/content/page-content.ts` chỉ dùng album mẫu khi `wedding.gallery` trống; thêm album
thật sẽ thay toàn bộ album mẫu. Đặt `sample: true` trên chương nào còn dùng ảnh mẫu.
Ảnh được tối ưu AVIF/WebP qua vite-imagetools, không lấy ảnh từ dịch vụ bên ngoài.
Có thể dựng lại sáu bố cục minh họa từ các lớp chibi đã duyệt bằng
`node scripts/generate-sample-gallery.mjs`. File `wedding.ts` vẫn đọc được bằng Node
cho các script QR và ảnh chia sẻ. Không thêm dữ liệu mẫu vào Firestore.

Kiểm tra regression chibi phần lời chúc (chưa gửi, đã gửi, gửi mới, lỗi kết nối):
chạy dev với `VITE_FIREBASE_API_KEY=local-visual-fixture npm run dev`, sau đó chạy
`node scripts/review-chibi-stories.mjs` (cần Playwright như script review chibi bên trên).
Script chặn module dịch vụ bằng fixture trong trình duyệt, kiểm tra chỉ có một nhân vật,
chuyển động khớp tay, giảm chuyển động và không tràn ngang trên mobile/desktop.
