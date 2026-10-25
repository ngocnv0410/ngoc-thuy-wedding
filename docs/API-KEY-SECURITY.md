# Xử lý cảnh báo Google API key công khai

Repo dùng GitHub Pages với Firebase Authentication và Cloud Firestore trực tiếp từ trình duyệt. Theo [tài liệu Firebase](https://firebase.google.com/docs/projects/api-keys), Firebase Web API key dùng để nhận diện project; dữ liệu được bảo vệ bằng Security Rules. Khóa này có thể xuất hiện trong JavaScript, nhưng phải giới hạn chỉ dùng các API Firebase cần thiết. Không dùng chung khóa này cho Gemini, Maps hoặc các API tính phí khác.

Mã nguồn hiện tại không lưu API key thật. GitHub Pages lấy khóa từ Repository Secret `VITE_FIREBASE_API_KEY`; cờ cấu hình không đọc lại khóa ghi cứng. Workflow chặn deploy khi thiếu Secret, và kiểm tra Google API key literals trong file được Git theo dõi mà không in giá trị khóa ra log.

## Thay khóa mà không làm gián đoạn lời chúc

Thao tác trong Google Cloud và GitHub Secrets cần tài khoản chủ project/repository. Quyền sửa code qua GitHub connector không tự cấp quyền quản lý API keys, Actions Secrets hoặc cảnh báo Secret Scanning.

1. Mở [Google Cloud → Credentials, project wedding-bfc6a](https://console.cloud.google.com/apis/credentials?project=wedding-bfc6a). Tạo **API key mới** trong cùng project; không tạo service-account key. Đặt tên dễ nhận biết như `Wedding Web`.
2. Trong khóa mới → **Application restrictions → Websites (HTTP referrers)**, cho phép:

   ```text
   https://ngocthuywedding.io.vn/*
   https://ngocnv0410.github.io/*
   ```

   Chạy local nên dùng Firebase Emulator; không cần mở thêm localhost cho khóa production.
3. Trong **API restrictions → Restrict key**, chỉ cho các Firebase API cần dùng. Theo allowlist chính thức, kiểm tra **Identity Toolkit API**, **Token Service API**, **Google Cloud Firestore API**, **Cloud Datastore API**, **Firebase Management API**, **Cloud Logging API**. Nếu dùng App Check, thêm **Firebase App Check API**. Không thêm **Generative Language API** hoặc API ngoài Firebase. Đối chiếu [danh sách Firebase cập nhật](https://firebase.google.com/docs/projects/api-keys#firebase-related-apis) nếu có lỗi `API_KEY_SERVICE_BLOCKED`.
4. Mở [GitHub → Repository Secrets](https://github.com/ngocnv0410/ngoc-thuy-wedding/settings/secrets/actions), tạo/cập nhật **Repository Secret** `VITE_FIREBASE_API_KEY` bằng khóa mới. Không gửi khóa mới qua chat, issue hoặc PR. Các định danh project khác không cần đổi.
5. Merge bản sửa và chạy **Deploy GitHub Pages**. Kiểm tra website mới tải được phần lời chúc; kiểm tra Anonymous Auth/refresh token với khóa mới từ domain được cho phép. Không ghi lời chúc giả vào database thật.
6. **Sau khi bản mới đã chạy đúng**, quay lại Google Cloud và thu hồi/xóa khóa cũ. Nếu khóa dùng chung cho ứng dụng khác, chuyển những ứng dụng đó sang khóa phù hợp trước khi xóa. Không chỉ xóa dòng trong source rồi coi như khóa cũ đã vô hiệu.
7. Trong GitHub → Security → Secret scanning, đối chiếu đúng cảnh báo và khóa cũ. Chỉ đánh dấu **Revoked** khi đã thu hồi thực tế; không đóng cảnh báo như đã giải quyết khi mới chuyển khóa sang biến môi trường. Nếu đây là email từ Google Cloud, kiểm tra lại API restrictions theo hướng dẫn Firebase.

Việc bỏ khóa khỏi phiên bản hiện tại không xóa các commit, PR hoặc bản JavaScript đã phát hành trước đây. Thu hồi khóa cũ xử lý việc tái sử dụng các bản sao đó. Bản sửa này không rewrite/force-push lịch sử Git.

## Lưu ý về giới hạn domain

HTTP referrer restriction giúp hạn chế request hợp lệ xuất phát từ domain khác, nhưng không thay thế Security Rules hoặc Auth. Giữ [firestore.rules](../firestore.rules) hiện tại; chỉ bật App Check enforcement sau khi frontend được cấu hình và kiểm tra thành công.

Repository Secret không phải server-side secret khi tên biến có tiền tố `VITE_`: Vite nhúng giá trị vào bundle để SDK Firebase trên trình duyệt dùng. Private key, service account và token quản trị tuyệt đối không đưa vào frontend.
