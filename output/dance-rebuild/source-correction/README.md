<!-- // [DANCE-SWAP] -->
# Dựng lại nguồn nhảy và tiếp xúc tay

**Bản nháp để xem lại, chưa xác nhận đạt mục tiêu giống 95%.** Không thay tỷ lệ/model GLB, camera, ánh sáng, layout, âm thanh/controller hay DISPLAY_MODE. Đang chờ người dùng chọn giữa giữ tỷ lệ chibi và cho phép chỉnh tỷ lệ đầu/tay để làm đúng các tư thế giơ qua đầu.

## Nguồn và thời gian

- Video 1 và 2: BANG BANG BANG. Video 3: BAD – ATEEZ, đúng phân loại người dùng.
- Nhạc BANG hiện tại khớp video 1 từ giây 0, tương quan dạng sóng 0,9988. Đây là căn thời gian âm thanh, **không phải 99,88% giống động tác**.
- Video 2 có bản chạy đúng tốc độ ở nửa sau. Cửa sổ dùng để dựng pose: **43,8–72,244444 giây**, tốc độ **1**, khớp nhạc ở khoảng 43,79575 giây. Bản cũ lấy phần hướng dẫn chậm rồi tăng tốc 1,333821 lần.
- Dùng người hướng dẫn rõ ràng trong video 2 làm nguồn pose liên tục, video 1 làm chuẩn nhạc/phong cách. Không dùng kết quả trích xuất nhóm đổi nhầm người. Hai video có một số biến thể thể hiện, không tuyên bố khớp cả hai từng frame.
- BAD lấy lại video 3 đầy đủ 27,4 giây. Không lấy hoặc đổi tên clip BANG thành BAD.

Các mốc nhìn thấy trong phần thường của video 2: t=0 đứng mở chân; khoảng 2s đánh tay ngang thân; 4s một tay giơ cao, tay kia ở hông; 8s đổi tay gần đầu/nhún hông; 12s xoay nghiêng và bước; 18s bắt chéo hai tay; 24s nhấc hai tay và hạ trọng tâm; gần 28s trở về tư thế chuẩn bị. Đây là mốc quan sát, không phải danh sách động tác tự thêm.

## Đã sửa

- Đo hướng X/Y theo hình ảnh để giữ silhouette; chiều sâu dùng ước lượng MediaPipe, không nhận là mocap 3D chính xác.
- Trục đầu lấy từ tai–cổ, thay cách nose–mouth gây cúi/xoắn. Giới hạn các lần lật trục do bộ ước lượng; giữ các mốc thời gian.
- Chuyển động giơ tay chia cho clavicle và cánh tay để giảm kéo toàn bộ chuyển động quanh một điểm nách.
- Đo vùng váy từ các đỉnh thực sự được skin theo xương skirt ở pose hiện tại. Giải lại tay khi có tiếp xúc, kể cả khi crossfade; không ép tay vốn nằm **ngoài phía sau váy** ra trước chỉ vì nó bị khuất.
- Ưu tiên giữ độ cao của cử chỉ khi chọn nghiệm tránh đầu/váy. Không kéo dài tay trong bản giữ tỷ lệ này.
- Đầu/cuối loop dùng các anchor cố định, tránh đường blend có trục đổi đột ngột. Có blend 0,6s ở mỗi mép; phần này là nối loop, không phải động tác gốc mới.

## Điểm chưa thể cam kết

1. **Giơ qua đầu không khả thi với tỷ lệ hiện tại.** Nam: vai khoảng 0,765 + hai đoạn tay khoảng 0,300 = cổ tay tối đa khoảng 1,065 khi thân thẳng. Nữ: 0,850 + 0,301 = khoảng 1,151. Đỉnh đầu khoảng 1,600. Chuyển động vai giúp thêm một phần nhỏ, không bù hết khoảng thiếu. [Sơ đồ giới hạn](reach-constraint.png). Quy tắc trước của người dùng yêu cầu giữ tỷ lệ model nên bản này chưa tự ý thu đầu/kéo tay.
2. Khớp bị che vẫn là ước lượng. BANG không mất cả pose trong đoạn hướng dẫn, nhưng một số cổ tay vượt mép khung có confidence thấp. BAD có 6 frame cuối không nhận được pose; khuỷu/cổ tay bị che ở một số đoạn. Ngưỡng dùng BAD 0,15 giữ ước lượng liên tục thay vì nội suy bỏ trống nhiều giây; thống kê dưới 0,45 vẫn ghi riêng trong `sources.json`. Không dùng số này để tuyên bố 95%.
3. Nách áo chưa có retopology/corrective sculpt hay mô phỏng vải. Đã thêm chuyển động vai, nhưng không cam kết hết mọi trường hợp thừa hình học chỉ từ test số học.
4. Envelope và ellipsoid là xấp xỉ, không phải va chạm chính xác toàn bộ tam giác. Nữ chưa có bone từng ngón. Cần xem video so sánh và chốt tỷ lệ trước khi tuyên bố hoàn thành mục tiêu thẩm mỹ 95%.

## Kiểm tra và tái dựng

185 test gồm loop, sàn, không trôi, chiều dài tay, palm rigidity, nhìn thấy cổ tay/lòng tay, crossfade và cổ tay/cẳng tay không xuyên envelope váy. Log trình duyệt 10 loop/mode nằm trong thư mục này khi hoàn tất; SwiftShader CPU không đại diện cho độ mượt trên GPU điện thoại. Lint có hai cảnh báo cũ ngoài phạm vi.

`extract-source.py` dùng MediaPipe ngoài ứng dụng, không thêm thư viện cho website. Với BANG dùng `--start 43.8 --frames 854 --crop 0 350 576 674` trên video 2; BAD dùng `--start 0 --frames 822` trên video 3. Lưu kết quả thành `bang-landmarks.json`/`bad-landmarks.json`, sau đó chạy `build-motion.py <thư-mục-landmark> <repo>` trong môi trường có NumPy/SciPy. Đường dẫn model PoseLandmarker truyền qua `--model`.

File sửa thuộc dữ liệu/logic nhảy: hai JSON clip, `motion.ts`, `glbCharacter.ts`, `armReach.ts` và các test liên quan. Không có sửa GLB/màu ở lượt này. Danh sách đầy đủ trong `validation.json`. Revert commit của PR để quay lại bản trước.
