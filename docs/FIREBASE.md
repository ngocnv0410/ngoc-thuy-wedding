# Gửi lời chúc bằng Firestore

Website vẫn là website tĩnh trên GitHub Pages. Trình duyệt dùng Firebase Authentication ẩn danh và Cloud Firestore; không có server riêng, Admin SDK hoặc Cloud Functions.

## 1. Chuẩn bị Firebase

1. Trong [Firebase Console](https://console.firebase.google.com/), tạo hoặc chọn dự án dành cho thiệp.
2. Project settings → General → Your apps → tạo ứng dụng **Web**, sao chép `firebaseConfig`.
3. Build → Firestore Database → tạo database **`(default)`** ở chế độ production.
4. Build → Authentication → Sign-in method → bật **Anonymous**. Khách không nhìn thấy màn đăng nhập.
5. Authentication → Settings → Authorized domains: thêm `ngocnv0410.github.io` cho website thật; thêm `localhost` nếu dùng dự án thật khi chạy local.

Không cần gửi hoặc tạo khóa service account. `apiKey`, `authDomain`, `projectId` và `appId` của ứng dụng Web được thiết kế để có thể xuất hiện trong mã frontend; quyền dữ liệu do Firestore Rules quyết định.

## 2. Áp dụng Firestore Rules

Dán nội dung [firestore.rules](../firestore.rules) vào Firestore Database → Rules → **Publish**. Không dùng quy tắc test cho phép mọi người đọc/ghi toàn bộ database.

Hoặc, với CLI đã đăng nhập vào đúng tài khoản:

```sh
npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

File rules của repo dành cho dự án riêng của thiệp. Nếu dự án đã có ứng dụng khác, ghép riêng khối `match /weddingWishes/{guestId}` vào rules hiện có trước khi triển khai; không thay toàn bộ rules của ứng dụng khác.

Quyền của khách:

- Đọc công khai tối đa 50 tài liệu mỗi truy vấn; website nghe 40 lời chúc gần nhất, sắp theo thời gian server.
- Chỉ tạo tài liệu có ID bằng UID của chính mình, chỉ có `name`, `message`, `createdAt`.
- Tên 1–60 ký tự, lời chúc 1–600 ký tự, không rỗng hoặc toàn khoảng trắng; thời gian phải là `serverTimestamp()`.
- Không được sửa, ghi đè hoặc xóa lời chúc từ client. Một UID ẩn danh gửi được một lời chúc. Giới hạn này theo UID trình duyệt, không xác minh danh tính thật.
- Quản lý/xóa lời chúc trong Firebase Console bằng tài khoản chủ dự án.

## 3. Cấu hình website

**Cách đơn giản trên GitHub Pages:** điền bốn trường vào [src/content/firebase.ts](../src/content/firebase.ts). Sau khi hoàn tất database, Rules và Anonymous Auth ở hai bước trên, đặt `firebaseGuestbookReady = true` trong cùng file rồi commit và push `main`. Workflow hiện có tự build và deploy. Cờ này giữ form chưa công khai trong lúc backend chưa sẵn sàng; môi trường development vẫn có thể thử giao diện với emulator.

```ts
export const firebaseWebConfig: FirebaseOptions = {
  apiKey: 'WEB_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  appId: 'YOUR_WEB_APP_ID',
}
```

Hoặc tạo Repository **Variables** trong GitHub Settings → Secrets and variables → Actions:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

Workflow đã nối các biến này vào bước build. Giá trị không rỗng sẽ thay cấu hình trong file; thay variables xong cần chạy lại workflow Deploy GitHub Pages. Chạy local có thể copy `.env.example` thành `.env.local` rồi điền giá trị.

## App Check tùy chọn

Client hỗ trợ `VITE_FIREBASE_APPCHECK_SITE_KEY`, là site key của reCAPTCHA v3 đã đăng ký với Firebase App Check cho đúng Web app và domain. Cấu hình site key, deploy và kiểm tra request hợp lệ trước khi bật enforcement cho Firestore/Authentication trong Console. Không bật enforcement nếu frontend chưa được cấu hình App Check. App Check bổ sung kiểm tra ứng dụng; không thay thế Firestore Rules.

## Chạy thử không đụng dữ liệu thật

Cần Node.js 24 và Java 21 trở lên. Firebase CLI và Rules Unit Testing đã có trong dev dependencies.

```sh
npm run test:rules
```

Để thử giao diện với database rỗng tại máy local, mở hai terminal:

```sh
npx firebase emulators:start --only auth,firestore --project demo-ngoc-thuy-wedding
```

```sh
VITE_FIREBASE_API_KEY=demo-key \
VITE_FIREBASE_PROJECT_ID=demo-ngoc-thuy-wedding \
VITE_FIREBASE_APP_ID=demo-web-app \
VITE_FIREBASE_EMULATORS=true \
npm run dev -- --host 127.0.0.1
```

Vào `http://127.0.0.1:5173/#loi-chuc`. Emulator chỉ kết nối trong chế độ development, tại localhost/127.0.0.1; production không bật mục lời chúc cho project `demo-*`. Không dùng dữ liệu thử làm lời chúc thật trên website.

## Hành vi khi gửi

Client dùng transaction để kiểm tra tài liệu theo UID trước khi tạo; gửi lại không tạo thêm tài liệu. Form chỉ báo thành công sau khi Firestore xác nhận, không hiển thị ghi tạm ở local như lời chúc đã gửi. Khi lỗi, nội dung ô nhập vẫn còn để thử lại. Lời chúc được render dưới dạng text thuần, không chèn HTML của người gửi.
