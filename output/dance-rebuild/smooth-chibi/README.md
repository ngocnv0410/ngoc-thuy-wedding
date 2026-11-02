<!-- // [DANCE-SWAP] -->
Giữ nguyên tỷ lệ chibi theo lựa chọn mới của người dùng. Những thế quá tầm được thu thành cử chỉ gập tay gần ngực/má; không kéo dài tay hoặc thu đầu. Đây là bản nối tiếp PR #24; trạng thái “chờ chọn tỷ lệ” trong báo cáo PR #24 đã được giải quyết bằng lựa chọn này.

Điệu cũ dùng `loadMotion3D(id)` → `sampleMotion(clip, music.currentTime, pose)` → `actor.apply(pose)`. Pose vẫn có 37 số; không dùng AnimationMixer/AnimationClip hoặc đồng hồ timeScale riêng. Nhạc bắt đầu khi người dùng bật nhạc, pause/resume theo media clock, đổi điệu/cất tiếng nhạc dùng `transition()` 0,3 giây. Những giao diện này giữ nguyên.

| Clip đang nạp | FPS / thời lượng vòng | Nhịp và nguồn giữ nguyên |
| --- | --- | --- |
| `bangSourceMotion.json`, ID `bang-bang-bang` | 30 / 28,444444 s | 135 BPM; nguồn video 2 từ 43,8 s, tốc độ 1; video 1 làm chuẩn nhạc |
| `badInPlaceMotion.json`, ID `ateez-bad` | 30 / 27,4 s | Video 3 từ 0 s, tốc độ 1; clip không khai báo BPM độc lập, không tự đặt BPM mới |

Không thay âm thanh, điểm bắt đầu nhạc, playbackRate=1 hoặc trường dữ liệu source timing. Bản dựng lại dùng trực tiếp `music.currentTime`, không thêm độ trễ tích lũy bằng bộ damping chạy theo FPS.

| File sửa | Trước → sau |
| --- | --- |
| `src/components/dance3d/glbCharacter.ts` | Giải IK riêng từng khung → đọc đường cong đã lọc riêng cho hai skeleton; giữ nhánh giải từ pose nguồn khi không có track phù hợp. Thế vượt tầm/đến gần đầu → gập tay nhỏ hơn. Sửa tiếp xúc bằng góc xoay nhỏ nhất từ pose hiện tại. Giữ fade 0,3 s và chạm sàn sau fade. |
| `src/components/dance3d/armReach.ts` | Tìm cực tiểu có thể đổi đột ngột giữa hai phía → ưu tiên đường xuống/ra ngoài ổn định khi tránh đầu; cho phép khoảng đệm bổ sung khi bake offline. |
| `src/components/dance3d/motion.ts` | Giữ mảng 37 số; thêm metadata qua WeakMap để adapter đọc đúng clip/time. Không đổi cách scene gọi hàm. |
| Hai JSON clip nêu trên | Giữ nguyên toàn bộ keyframe nguồn 37 kênh; thêm `retargeted.groom/bride`, không đổi tên/ID hoặc độ dài clip. |
| `src/components/dance3d/glbCharacter.test.ts` | Thêm bốn kiểm tra toàn clip ở 60 Hz: tốc độ góc, bước/biến thiên vận tốc cổ tay, visibility, tiếp xúc và tua độc lập lịch sử. |

File code thêm: `src/components/dance3d/bakedMotion.ts` (kiểm tra chữ ký rig, nội suy quaternion có xử lý hai dấu tương đương). File hỗ trợ thêm nằm trong thư mục báo cáo này: `bake-motion.mjs`, `smooth-tracks.py`, `validation.json`, `bad-browser-loops.json`, `bangbangbang-browser-loops.json` và `comparison-poster.jpg`. Mọi file sửa/thêm đều chứa marker `[DANCE-SWAP]`. Không thêm thư viện cho ứng dụng.

Mapping giữ nguyên: hips→pelvis, torso→spine, head→head, vai→clavicleL/R, tay→upperArmL/R→forearmL/R→handL/R, chân→thighL/R→shinL/R→ankleL/R; cô dâu giữ skirtFront/Back/L/R và veil. `neck` giữ bind transform. Danh sách bone thiếu vẫn log `[DANCE-SWAP] Unmatched GLB bones`; hai model hiện tại không thiếu bone. Chữ ký các rest transform ngăn áp nhầm track sang rig khác. Không thêm root X/Z; grounding đo theo geometry giày/gấu váy như trước, không đổi scale model.

Bước lọc offline dùng median 5 mẫu, quaternion mean không phụ thuộc dấu, Gaussian đối xứng (tay/vai σ=2,6 frame; thân/chân σ=1,5), giới hạn biến thiên góc khoảng 9°/frame nguồn và làm dịu vận tốc góc. Không lấy trung bình tuyến tính các quaternion gần triệt tiêu nhau. Bake có khoảng đệm 0,04; một lượt chiếu tiếp xúc/lọc σ=1,0 hoàn tất khoảng an toàn giữa các keyframe. Ba mẫu mỗi mép dùng cùng anchor, nối loop và quy tắc sample cuối được giữ nguyên.

Đo trên toàn clip ở 30 Hz, đơn vị tọa độ hiện tại của model:

| Điệu / nhân vật | Bước cổ tay lớn nhất trước → sau | Góc bone lớn nhất giữa hai mẫu trước → sau |
| --- | --- | --- |
| BANG / nam | 0,487 → 0,060 | 109,0° → 8,8° |
| BANG / nữ | 0,145 → 0,026 | 73,1° → 7,1° |
| BAD / nam | 0,485 → 0,068 | 169,3° → 8,9° |
| BAD / nữ | 0,472 → 0,061 | 150,4° → 8,9° |

Ở 60 Hz: góc lớn nhất 4,47°, bước cổ tay lớn nhất 0,0343, không có lần phải giải lại tiếp xúc ở các mẫu thường. Số liệu này đo tính liên tục, không phải phần trăm giống video hoặc số FPS của thiết bị. `validation.json` có số liệu đầy đủ, SHA-256 chứng minh hai GLB không đổi, và kiểm tra dữ liệu nguồn không đổi. Các test cũ vẫn kiểm tra sàn y=0, root không trôi, palm rigidity, váy, crossfade và 10 vòng. Log trình duyệt ghi riêng lỗi/cảnh báo và độ trễ render trên SwiftShader CPU; không dùng nó để cam kết FPS điện thoại.

Cần tái dựng đường cong sau khi đổi nguồn hoặc rig (Node dùng các thư viện sẵn có trong repo; Python offline cần NumPy/SciPy):

```bash
DANCE_BAKE_OUT=/tmp/chibi-raw DANCE_BAKE_MARGIN=.04 node output/dance-rebuild/smooth-chibi/bake-motion.mjs
python output/dance-rebuild/smooth-chibi/smooth-tracks.py /tmp/chibi-raw .
DANCE_AUDIT=1 DANCE_BAKE_OUT=/tmp/chibi-refined DANCE_BAKE_MARGIN=.04 node output/dance-rebuild/smooth-chibi/bake-motion.mjs
python output/dance-rebuild/smooth-chibi/smooth-tracks.py /tmp/chibi-refined . 1.0
npm test
npm run build
```

Kiểm tra lại mẫu ở 60 Hz bằng `DANCE_AUDIT=1 DANCE_AUDIT_RATE=2 DANCE_BAKE_OUT=/tmp/chibi-audit node output/dance-rebuild/smooth-chibi/bake-motion.mjs`. Công cụ capture mặc định bỏ metadata để luôn lấy nhánh nguồn; chỉ `DANCE_AUDIT=1` mới lấy track đang bake.

Đổi điệu lần sau: (1) thay dữ liệu nguồn của clip đúng ID, fps/duration và mốc âm thanh; (2) bake/lọc bằng quy trình trên, kiểm tra và thay hai JSON tương ứng. Quay lại bản trước bằng revert commit của PR này; không cần sửa controller/model/nhạc. Xóa riêng `retargeted` sẽ dùng nhánh pose nguồn đã có cử chỉ chibi mới, nên đó không phải cách quay lại hoàn toàn bản cũ.

Các thế giơ cao/chạm vùng đầu đã chủ động khác biên độ video theo lựa chọn giữ chibi. Không cam kết giống 95%. Mốc nhịp giữ nguyên, nhưng lọc làm tròn các cú đánh rất sắc. Khớp khuất trong video vẫn là ước lượng; bàn tay nữ giữ hình học/rig cũ, không có chuyển động từng ngón mới. Khoảng tránh đầu/váy là ellipsoid/envelope, chưa phải mô phỏng vải/va chạm toàn bộ tam giác; nếp áo nách vẫn phụ thuộc topology/skin hiện có. Muốn nâng thẩm mỹ thêm nên chỉnh từng pose được chỉ rõ theo timestamp và corrective skin, thay vì đổi tỷ lệ chibi.

Dữ liệu bake làm tăng tải JSON: bản build hiện tại khoảng 0,37 MB gzip mỗi clip, nạp qua dynamic import như trước. Video xem trước được lấy mẫu offline 24 FPS tại các mốc media time; dùng để xem chuyển động, không đại diện cho hiệu năng SwiftShader/GPU trên thiết bị thật.

Kết quả cuối: 189/189 test qua, build/lint/check:secrets exit 0; chỉ còn hai cảnh báo lint và hai cảnh báo GSAP có sẵn ngoài phạm vi. Hai bài đều chạy 10 vòng audio liên tục, không có lỗi JavaScript hoặc cảnh báo console mới. SwiftShader ghi độ trễ render p95 khoảng 0,76–0,79 s khi chạy nhiều browser trên CPU; không thể dùng phiên này để xác nhận độ mượt theo thời gian thực trên điện thoại. Các giới hạn tốc độ/độ giật nêu trên đo đường cong pose theo media time, không thay đổi giới hạn render 30 FPS hiện có.
