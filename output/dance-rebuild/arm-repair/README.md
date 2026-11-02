<!-- // [DANCE-SWAP] -->
# Sửa tay/nách khi nhảy

Sửa lỗi tay chú rể bị khuôn mặt che, nách kéo theo thân áo; tay cô dâu bị kéo nhọn, xoắn và trông như có lỗ đen. Bản trước chỉ kiểm tra trọng số hợp lệ, đầu không bị tay kéo và vòng lặp; các kiểm tra đó chưa đủ để phát hiện lỗi ở nách/khuỷu/cổ tay. Lần này bổ sung kiểm tra trực tiếp các vùng này.

## Thay đổi

| Chỗ sửa | Trước | Sau |
| --- | --- | --- |
| Hai `public/models/wedding/*-rigged.glb` | Điểm xoay AI chưa trùng vai/khuỷu/cổ tay; một số đỉnh thân áo và UV seam nhận trọng số tay không phù hợp | Hiệu chỉnh điểm xoay theo mesh, làm sạch trọng số thân/tay/đầu, đồng nhất trọng số tại các đỉnh trùng vị trí, làm mượt normal riêng vùng tay |
| `glbCharacter.ts` | Xoay cánh tay và cẳng tay độc lập trong hệ thế giới; dùng hướng tay người thật cho đầu chibi rất lớn | Truyền độ xoắn từ cánh tay xuống cẳng tay, rồi giải IK hai đoạn khi cần đưa cổ tay ra trước/cạnh mặt trong đúng chiều dài tay |
| `armReach.ts` (mới) | Không kiểm tra tay bị đầu che | Kiểm tra tia hướng về camera với ellipsoid đầu có đệm cho lòng bàn tay/ngón; chọn hiệu chỉnh nhỏ nhất có thể với chiều dài tay hiện tại, tinh chỉnh dưới 1 mm |
| `glbCharacter.test.ts` | Test trọng số, sàn, loop, crossfade | Giữ test cũ và thêm test bàn tay cứng đúng mesh, thân áo không đi theo tay, chiều dài tay, khả năng nhìn thấy tay và chuyển mode |

**Vá màu riêng tay nữ:** 54 mặt da bị albedo AI tô quá tối được dùng một vật liệu da PBR bổ sung, lấy tông từ phần da tay lành. Đây không phải sửa ảnh texture hay đổi màu toàn nhân vật. Hai ảnh albedo/MR gốc của từng model được xác minh nguyên từng pixel (`texture-preservation.json`). Các mặt còn lại tiếp tục dùng vật liệu cũ. Không dùng chế độ xuyên vật thể, tắt depth test, hoặc đổi camera để làm tay hiện lên.

Không thay dữ liệu điệu nhảy, BPM/timeScale, nguồn nhạc, controller, DISPLAY_MODE, 2D/3D, layout, camera hay ánh sáng. Không sửa silhouette, tỉ lệ hoặc thêm/bớt tam giác: nam 35.999, nữ 35.988. Sai khác XYZ+UV khi xuất lại GLB dưới 0,0000015 đơn vị (`shape-preservation.json`).

## Xem trước/sau

Các cặp ảnh dùng cùng camera kiểm tra, ánh sáng, thời điểm trong clip. Camera này chỉ dùng để chụp cận cảnh QA; camera trên trang không bị sửa.

| Tình huống | Trước | Sau |
| --- | --- | --- |
| Nam, BANG 5,733333 s — tay giơ lên bị đầu che | [Trước](groom-bang-before.png) | [Sau](groom-bang-after.png) |
| Nam, BAD 4 s — tay/cổ tay/nách | [Trước](groom-bad-before.png) | [Sau](groom-bad-after.png) |
| Nữ, BAD 8 s — bàn tay/khuỷu bị kéo | [Trước](bride-bad-before.png) | [Sau](bride-bad-after.png) |
| Nữ, BANG 10,066667 s — giơ tay | [Trước](bride-bang-before.png) | [Sau](bride-bang-after.png) |

## Kiểm tra

- 184 test; build đạt. Lint đạt với hai cảnh báo cũ trong `chibi/artwork.test.ts` và `chibi/SeamlessArms.tsx` (ngoài phạm vi, không sửa).
- Cổ tay được kiểm tra với tia nhìn độc lập bằng `THREE.Ray`, bao gồm đầu nghiêng/quay và các bước chuyển mode. Không có cổ tay hoặc đỉnh lòng bàn tay lấy mẫu bị đầu che trong các mẫu kiểm tra. Đệm tránh đầu là 0,12 đơn vị cho nam và 0,10 cho nữ, được hiệu chỉnh cho hai mesh hiện tại.
- Không kéo dài xương tay. Sai số hình dạng lòng bàn tay dưới 0,005 đơn vị trong cả hai điệu; thân áo giữa dịch dưới 0,0001 đơn vị khi chỉ đổi tay.
- Vẫn giữ kiểm tra 10 vòng, không trôi X/Z, chạm sàn, khép vòng và crossfade 0,3 s.
- Chạy trình duyệt trên bản cuối: xem `*-browser-loops.json`. Chromium sử dụng SwiftShader CPU, không đại diện cho FPS/âm thanh trên GPU điện thoại; độ trễ render được giữ nguyên trong log, không che đi.

## Tái dựng

`refine-arm-skin.py` chạy trong Blender 4.3.2, không thêm phụ thuộc cho website:

```bash
blender -b --python refine-arm-skin.py -- --subject groom --input groom-before.glb --output groom-rigged.glb
blender -b --python refine-arm-skin.py -- --subject bride --input bride-before.glb --output bride-rigged.glb
```

Dùng GLB của commit nền `e8c1b5c` làm đầu vào, không chạy lặp lên GLB đã sửa. Script tạo báo cáo `.repair.json` bên cạnh đầu ra. Giữ hai file nguồn clip JSON và nối hai GLB với adapter/`armReach.ts` của PR này; chỉ thay GLB sẽ không có phần tránh đầu. Bộ tải xuống gồm GLB đã sửa, mã retarget và báo cáo.

Quay lại bằng revert commit của PR sửa tay này. Không cần đổi controller hoặc mode.

## Giới hạn

Giữ nguyên hình học gốc nên hình dáng các ngón và độ chi tiết bàn tay vẫn theo model thô; nữ chưa có bone riêng từng ngón. Cách hiệu chỉnh xoay cổ tay là quy tắc retarget: dữ liệu nguồn hiện tại chỉ chứa hướng vai/khuỷu/cổ tay, không cung cấp đầy đủ độ xoắn từng ngón. IK chỉ điều chỉnh các tư thế bị đầu lớn che, không thay thời điểm hay sáng tác thêm đoạn nhảy. Chưa có kiểm tra va chạm tay–tay/quần áo đầy đủ hoặc mô phỏng vải.
