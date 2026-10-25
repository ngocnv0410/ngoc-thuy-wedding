# Gửi lời chúc bằng Firestore

Website là website tĩnh trên Cloudflare Static Assets. Trình duyệt dùng Firebase Authentication ẩn danh và Cloud Firestore; không có server riêng, Admin SDK hoặc Cloud Functions.

## 1. Chuẩn bị Firebase

1. Trong [Firebase Console](https://console.firebase.google.com/), tạo hoặc chọn dự án dành cho thiệp.
2. Project settings → General → Your apps → tạo ứng dụng **Web**, sao chép `firebaseConfig`.
3. Build → Firestore Database → tạo database **`(default)`** ở chế độ production.
4. Build → Authentication → Sign-in method → bật **Anonymous**. Khách không nhìn thấy màn đăng nhập.
5. Authentication → Settings → Authorized domains: thêm `ngoc-thuy-wedding.ngoc-nv0410.workers.dev` cho website thật; giữ `ngocnv0410.github.io` nếu vẫn dùng link cũ; thêm `localhost` nếu dùng dự án thật khi chạy local.

Không cần gửi hoặc tạo khóa service account. `apiKey`, `authDomain`, `projectId` và `appId` của ứng dụng Web được thiết kế để có thể xuất hiện trong mã frontend; quyền dữ liệu do Firestore Rules quyết định.

## 2. Áp dụng Firestore Rules

Dán nội dung [firestore.rules](../firestore.rules) vào Firestore Database → Rules → **Publish**. Không dùng quy tắc test cho phép mọi người đọc/ghi toàn bộ database.

Hoặc, với CLI đã đăng nhập vào đúng tài khoản:

```sh
npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

File rules của repo dành cho dự án riêng của thiệp. Nếu dự án đã có ứng dụng khác, ghép riêng khối `match /weddingWishes/{guestId}` vào rules hiện có trước khi triển khai; không thay toàn bộ rules của ứng dụng khác.

Quyền của khách:

- Đọc công khai tối đa 50 tài liệu mỗi truy vấn; website nghe 40 lời chúc gần nhất, sắp theo thời gian server. Lời chúc của chính khách được ghim ở đầu, kể cả khi đã nằm ngoài 40 lời chúc gần nhất.
- Chỉ tạo tài liệu có ID bằng UID của chính mình, chỉ có `name`, `message`, `createdAt`.
- Tên 1–60 ký tự, lời chúc 1–600 ký tự, không rỗng hoặc toàn khoảng trắng; thời gian phải là `serverTimestamp()`.
- Không được sửa, ghi đè hoặc xóa lời chúc từ client. Một UID ẩn danh gửi được một lời chúc. Giới hạn này theo UID trình duyệt, không xác minh danh tính thật.
- Quản lý/xóa lời chúc trong Firebase Console bằng tài khoản chủ dự án.

## 3. Cấu hình website

Thêm biến trong Cloudflare Worker → **Settings → Build → Build variables and secrets**:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

Các giá trị tương ứng với `apiKey`, `authDomain`, `projectId`, `appId` trong Firebase Web config. `authDomain` có thể tự suy ra nếu bỏ trống. Không còn cấu hình Firebase thật lưu cứng trong mã nguồn. Chạy local: copy `.env.example` thành `.env.local` rồi điền giá trị; file này được Git bỏ qua.

Chọn **Secret** để che giá trị trong Cloudflare Dashboard. Các biến `VITE_*` vẫn được đưa vào JavaScript công khai khi build; chúng không phải khóa quản trị. Sau khi thay biến phải build/deploy lại. Xem [hướng dẫn Cloudflare](CLOUDFLARE.md) để đặt đúng phần Build, không nhầm với runtime secrets.

Sau khi database, Rules và Anonymous Auth đã sẵn sàng, giữ `firebaseGuestbookReady = true` trong [src/content/firebase.ts](../src/content/firebase.ts). Cloudflare Git integration build/deploy nhánh `main`; GitHub Actions chỉ chạy kiểm tra.

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

Khi mở phần lời chúc, client khôi phục UID và kiểm tra tài liệu đã gửi trước khi hiện ô nhập. Khách đã gửi sẽ thấy lời cảm ơn và lời chúc cũ ngay; trong lúc kiểm tra hoặc khi kiểm tra lỗi, form chưa mở để tránh nhập lại vô ích. Việc kiểm tra không tạo tài khoản ẩn danh mới.

Client vẫn dùng transaction để kiểm tra tài liệu theo UID trước khi tạo, phòng hai tab cùng gửi; gửi lại không tạo thêm tài liệu. Form chỉ báo thành công sau khi Firestore xác nhận và đưa lời chúc đã lưu lên đầu danh sách ngay, không cần reload hay đợi truy vấn danh sách cập nhật. Thời gian ban đầu là lúc nhận xác nhận, sau đó listener thay bằng thời gian server. Khi lỗi, nội dung ô nhập vẫn còn để thử lại. Lời chúc được render dưới dạng text thuần, không chèn HTML của người gửi.
