<!-- // [DANCE-SWAP] -->
# Nhân vật qua AI miễn phí

Hai GLB dùng trên trang đã được thay bằng texture PBR từ **Hunyuan3D-Paint 2.1**, skeleton dự đoán bởi **UniRig**, và skin weight từ **SkinTokens**. Chi phí thực tế: **0**. Không có thư viện mới trong ứng dụng.

## Công cụ đã chạy

- Tô màu: https://huggingface.co/spaces/Upsampler/hunyuan3d-paint — upload mesh không rig, có UV, và ảnh chính diện cắt từ ảnh mẫu của người dùng. Mỗi model chạy khoảng 30 giây. Mặt bên/lưng do mô hình AI suy diễn; không phải đối chiếu chính xác cả bốn ảnh.
- Xương: UniRig ONNX từ https://github.com/fernandotonon/QtMeshEditor, chạy CPU cục bộ. Chú rể: 46 khớp dự đoán; cô dâu: 19. Encoder dùng 4.096 điểm, trong đó 2.048 điểm FPS; attention được chuyển Einsum sang MatMul tương đương để giảm bộ nhớ. Decoder dùng greedy có ràng buộc và chỉ giữ KV cache hiện tại. Đây là dự đoán AI thật, không dùng skeleton template dự phòng.
- Skin: QtMeshEditor Docker, digest `sha256:c72f91068b3d1f3447b5c164c93447de7fab3cd59e9e0b82ea24fdf13d1051b5`, `skin --algo skintokens --max-influences 4`. Log của cả hai xác nhận `algorithmUsed: skintokens`.
- Hoàn thiện: Blender 4.3.2 dựng lại bind pose và chuyển trọng số AI sang mesh/UV/vật liệu Hunyuan gốc. Bản xuất trực tiếp của QtMeshEditor có lỗi UV/bind nên không được dùng trên trang. Không đổi silhouette hoặc chiều cao hiện tại (~1,6 đơn vị).
- Váy/khăn: giữ lại 5 helper và trọng số quần áo có sẵn. Đây là phần hiệu chỉnh thủ công có sẵn, **không phải mô phỏng vải AI**. Thân/tay/đầu dùng rig AI mới.

Make-It-Animatable trên Hugging Face đã được thử nhưng hết quota GPU. Không dùng tài khoản trả phí và không cần người dùng gửi token. Chọn Hugging Face miễn phí của người dùng đã được ghi nhận; đường CPU đã hoàn thành phần rig.

## Phạm vi và diff

| File sửa | Trước | Sau |
| --- | --- | --- |
| `public/models/wedding/groom-rigged.glb` | Rig theo vùng thủ công, ảnh bốn góc chiếu lên mesh, vật liệu unlit | 46 khớp UniRig, SkinTokens, albedo/roughness AI PBR |
| `public/models/wedding/bride-rigged.glb` | Rig thủ công + helper váy/khăn, ảnh chiếu, unlit | 19 khớp UniRig + 5 helper quần áo, SkinTokens cho thân, PBR AI |
| `src/components/dance3d/glbCharacter.test.ts` | Yêu cầu `MeshBasicMaterial` của ảnh chiếu | Yêu cầu `MeshStandardMaterial` của texture AI; giữ toàn bộ kiểm tra chuyển động |

Các file mới trong thư mục này là báo cáo, bảng ánh xạ, script hoàn thiện, ảnh và kết quả kiểm tra. `*-ready-audit.json` ghi kiểm tra rig AI trước khi đổi tên/ghép helper; báo cáo tổng hợp `validation.json` mô tả bản GLB cuối. Báo cáo `../drive-rig/validation.json` và script tô màu cũ là lịch sử của lần trước.

Không sửa scene, camera, ánh sáng, layout/CSS, âm thanh, controller, DISPLAY_MODE, 2D/3D, trigger hay dữ liệu điệu nhảy. BAD vẫn 30 fps / 27,4 s, không khai báo BPM trong clip. BANG BANG BANG vẫn 30 fps / 28,444444 s / 135 BPM / playbackRate 1; sourceTimeScale 1,333821 đã có từ trước. Đồng hồ lấy từ nhạc, vòng lặp và crossfade 0,3 s giữ nguyên.

## Kiểm tra

- 178 test, build và lint đạt. Test có chạy cả hai điệu trên cả hai model qua 10 vòng, kiểm tra X/Z không trôi, điểm sàn, pose cuối/đầu, crossfade và skeleton clone.
- Các đỉnh có trọng số chuẩn hóa, tối đa 4 ảnh hưởng. Xoay tay thử 40° không kéo đỉnh trên đầu; các giá trị hữu hạn.
- Kết quả chạy trình duyệt thật 10 vòng/mode nằm trong `*-browser-loops.json`. Render dùng Chromium SwiftShader trên CPU; số liệu độ trễ trong file không thay thế kiểm tra FPS/âm thanh trên điện thoại có GPU. So sánh kiểm soát GLB cũ/AI không có cảnh báo mới: GSAP và THREE.Clock có ở cả hai. Một lượt ngắn còn ghi cảnh báo PCFSoftShadowMap của phần mở đầu (`Doors3D.tsx:58`, không sửa); xem `console-comparison.json`.

## Giới hạn còn lại

- Giữ hình học gốc nên tai/cằm, mắt và cấu trúc tóc không thể trùng ảnh mẫu chỉ bằng texture. Màu phụ kiện nhỏ và phía sau vẫn có chi tiết AI ước lượng.
- Cô dâu không có mesh chân/bàn chân lộ ra dưới váy; các khớp chân là ước lượng. Váy/khăn dùng helper, chưa có mô phỏng vải hay kiểm tra va chạm đầy đủ.
- Rig có ngón tay chú rể nhưng dữ liệu điệu nhảy hiện tại không điều khiển từng ngón. Không tuyên bố chuyển động khớp video từng frame.
- Hai GLB PBR nặng hơn bản ảnh chiếu trước; cần thử thêm trên máy di động thật. Có thể cải thiện bằng chỉnh topology/weight ở vai, mô phỏng vải, hiệu chỉnh texture thủ công và tối ưu texture sau khi duyệt hình ảnh.

## Tái dựng / thay lần sau

Bộ tải xuống kèm dữ liệu AI trung gian, GLB và Blender, cùng bản cô dâu cũ dùng làm nguồn helper. Đặt `WEDDING_AI_WORKDIR` trỏ tới thư mục làm việc đó; `WEDDING_AI_SOURCE_DIR` trỏ tới thư mục GLB Drive gốc (`gloom.glb`, `bride.glb`). Chạy Blender:

```bash
blender -b --python rebuild-ai-rig.py -- groom
blender -b --python rebuild-ai-rig.py -- bride
blender -b --python retarget-interface.py -- groom
blender -b --python retarget-interface.py -- bride
```

1. Thay đầu vào AI trong bộ làm việc, chạy hai bước dựng bind/đổi tên ở trên; kiểm tra `*-bone-map.json` và quần áo.
2. Chép `groom-retarget.glb`, `bride-retarget.glb` vào hai đường dẫn GLB hiện tại; chạy test/build và kiểm tra 10 vòng trước khi đưa lên web.

Đổi riêng điệu nhảy lần sau: cập nhật clip JSON tương ứng trong `src/components/dance3d/`, giữ giao diện 37 kênh và mốc nhạc, rồi chạy kiểm tra retarget có sẵn. Quay lại bản cũ bằng revert commit của PR AI này; không cần đổi controller hoặc DISPLAY_MODE.
