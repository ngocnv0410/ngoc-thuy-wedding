# Triển khai thiệp trên Cloudflare

Địa chỉ hiện tại: https://ngoc-thuy-wedding.ngoc-nv0410.workers.dev/

Đây là **Cloudflare Workers Static Assets**, không phải Pages. Repo cấu hình Worker `ngoc-thuy-wedding` chỉ phục vụ website tĩnh trong `dist`: không có `main`, Worker script, Functions, KV, R2 hoặc server API. Theo giá hiện tại, yêu cầu đến static assets miễn phí và không giới hạn; lưu assets không tính thêm phí. Firebase là dịch vụ riêng, có hạn mức miễn phí riêng.

## 1. Kết nối repository và cấu hình build

Cloudflare Dashboard → Workers & Pages → `ngoc-thuy-wedding` → Settings → Build:

| Mục | Giá trị |
| --- | --- |
| Git repository | `ngocnv0410/ngoc-thuy-wedding` (có thể private) |
| Production branch | `main` |
| Root directory | gốc repository |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |

Node.js được cố định bằng `.node-version`. Wrangler được cài và cố định trong dev dependencies. Giữ bước tự cài dependencies của Workers Builds; không bật `NODE_ENV=production` trong lúc cài vì build cần dev dependencies. Cloudflare tự tạo token triển khai cho Git integration; không cần đưa token vào mã nguồn hoặc gửi qua chat.

## 2. Đặt biến và Secret ở đúng phần Build

Trong **Settings → Build → Build variables and secrets**, thêm:

| Tên biến | Giá trị từ cấu hình Firebase Web |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain`; có thể bỏ trống để tự dùng `<projectId>.firebaseapp.com` |

Chọn kiểu **Secret** nếu muốn Cloudflare che giá trị trong giao diện. Ba biến đầu bắt buộc. Không cần `storageBucket` hoặc `messagingSenderId` vì thiệp chỉ dùng Auth và Firestore.

Biến tùy chọn:

- `SITE_URL`: `https://ngoc-thuy-wedding.ngoc-nv0410.workers.dev`, hoặc tên miền chính thức sau này; dùng cho ảnh và link xem trước khi chia sẻ. Script đã mặc định đúng địa chỉ Worker hiện tại.
- `VITE_FIREBASE_APPCHECK_SITE_KEY`: site key reCAPTCHA v3 nếu đã cấu hình Firebase App Check; nếu chưa thì để trống.

**Settings → Variables & Secrets ở runtime không được tự đưa vào bước build.** Đặt biến ở phần Build nêu trên. Website tĩnh không có server đọc secret vào lúc người dùng truy cập. Mỗi lần thay biến cần build/deploy lại.

Vite đưa `VITE_*` vào JavaScript gửi đến trình duyệt. Lưu dưới dạng Secret giúp không commit cấu hình vào repo, không che Firebase Web config khỏi khách truy cập. Bảo vệ dữ liệu bằng [firestore.rules](../firestore.rules); không dùng Firebase Admin SDK, private key hoặc service account trong frontend. Cấu hình Web từng commit vẫn có trong lịch sử Git; thay đổi này không viết lại lịch sử.

Build sẽ dừng nếu thiếu biến bắt buộc hoặc đang trỏ đến project emulator, tránh xuất bản thiệp thiếu phần lời chúc.

## 3. Thêm domain Firebase và triển khai

1. Firebase Console → Authentication → Settings → Authorized domains: thêm `ngoc-thuy-wedding.ngoc-nv0410.workers.dev`. Nếu đang giới hạn API key theo HTTP referrer, thêm domain mới vào danh sách cho phép. Nếu đang dùng App Check, thêm domain mới vào cấu hình reCAPTCHA tương ứng.
2. Cloudflare → Builds → **Retry build** hoặc đẩy commit mới lên `main`.
3. Kiểm tra trạng thái deploy thành công, mở link thiệp trên PC/điện thoại, kiểm tra nhạc, ảnh, QR và phần lời chúc. Không tạo lời chúc giả trong database thật.

Các lời chúc cũ vẫn nằm trong cùng Firebase project. Danh tính Anonymous Auth lưu theo origin trình duyệt: khi chuyển từ `github.io` sang `workers.dev`, phiên khách cũ không tự chuyển sang domain mới, nên khách cũ có thể gửi thêm một lời chúc từ domain mới.

GitHub Actions chỉ kiểm tra unit tests, Firestore Rules bằng emulator, build và Wrangler dry-run. Nó không triển khai GitHub Pages và không cần Firebase config thật. Bản GitHub Pages đã xuất bản vẫn tồn tại cho tới khi chủ repo tắt Pages; chỉ chuyển link chính thức sau khi Cloudflare đã chạy đúng.

## Chạy thử tại máy local

Copy `.env.example` sang `.env.local`, điền Firebase Web config và chạy:

```sh
npm ci
npm test
npm run build:cloudflare
npx wrangler deploy --dry-run
npm run preview:cloudflare
```

Để triển khai từ CLI, cần đăng nhập tài khoản Cloudflare có quyền đối với Worker hiện tại, sau đó chạy `npm run deploy:cloudflare`. Lệnh này đưa `dist` đã build lên mạng; chạy build trước mỗi lần deploy.

## Nếu chọn Cloudflare Pages thay cho Worker hiện tại

Tạo project **Pages → Connect to Git**; dùng cùng repo và nhánh `main`, build command `npm run build:cloudflare`, output directory `dist`. Đặt bốn biến Firebase trong biến môi trường build của Pages, `SITE_URL` thành URL `*.pages.dev` thật và thêm domain đó ở Firebase. Pages không sử dụng `wrangler.jsonc` này để deploy; không nhập Workers deploy command vào Pages.

## Chi phí và hạn mức

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/): request đến assets miễn phí, không giới hạn, không có phí lưu assets bổ sung; mỗi file tối đa 25 MiB.
- [Pages Free](https://developers.cloudflare.com/pages/platform/limits/), nếu dùng Pages: 500 builds/tháng, tối đa 20.000 file và 25 MiB/file. Request static miễn phí, không giới hạn.
- [Firestore free quota](https://firebase.google.com/docs/firestore/quotas): 50.000 lượt đọc và 20.000 lượt ghi/ngày, 1 GiB dữ liệu, 10 GiB outbound/tháng. Lời chúc trực tiếp có thể phát sinh thêm lượt đọc khi có khách mở thiệp.
- Tên miền `workers.dev`/`pages.dev` có sẵn; mua tên miền riêng là chi phí riêng. Không cần bật gói Workers trả phí cho cấu hình chỉ có static assets này.
