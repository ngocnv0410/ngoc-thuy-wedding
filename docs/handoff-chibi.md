# Handoff Spec: Tiêu đề rõ nghĩa + Chibi đồng hành xuyên trang

> Duyệt ngày 23/10/2026. Chibi là lớp trang trí `aria-hidden`: không bao giờ che chữ hay nút, tư thế tĩnh khi bật giảm chuyển động, phone luôn ở bản 2.5D.

---

## 1. Tiêu đề (bước 1)

| Vị trí | File | Hiện tại | Mới |
|---|---|---|---|
| Bìa: eyebrow | `src/scenes/Hero/Hero.tsx:35` | Thiệp mời cưới · 2026 | Giữ nguyên |
| Bìa: tagline | `src/content/wedding.ts:34` (`couple.tagline`) | Một câu chuyện được viết bằng ánh sáng | **Rất mong được đón bạn đến chung vui** |
| Thông tin lễ: h2 | `src/scenes/Details/Details.tsx:46` | Trân trọng báo tin | **Ngày vui của {first} & {second}**, ghép từ `orderedCouple(couple)` (ra “Ngày vui của Ngọc & Thủy”). Không hard-code tên. Eyebrow “Thông tin lễ cưới” giữ nguyên |
| Lịch: h3 | `wedding.ts:40,46` | Lễ ăn hỏi / Lễ đón dâu | Giữ nguyên |
| Địa điểm: h2 | `src/scenes/Locations/Locations.tsx:47` | Đường về chung một nhà | **Nơi ngày vui diễn ra**. Eyebrow “Địa điểm tổ chức” giữ nguyên |
| Lời cảm ơn: h2 | `src/scenes/Gift/Gift.tsx:37` | Thương gửi bạn | Giữ nguyên |
| Quà mừng: h3 | `src/scenes/Gift/Gift.tsx:55` | Gửi lời chúc phúc | **Gửi quà mừng**. Phần này chỉ có QR và số tài khoản, không có form nhập lời nhắn |

Ghi chú:
- Tagline cũng được dùng cho ảnh OG (`scripts/share.ts:17` → `scripts/generate-og.ts:155`). `npm run assets` chạy trước `dev`/`build` sẽ tự sinh lại ảnh. Câu mới dài 35 ký tự, ở cỡ 30px vẫn nằm trên một dòng trong khung 1200px.
- Dòng kết “Hẹn gặp bạn trong ngày vui của chúng mình” (`Gift.tsx:80`) giữ nguyên. Sau khi đổi, chữ “ngày vui” còn xuất hiện 3 lần ở 3 vị trí cách xa nhau, chấp nhận được.
- `ChapterNav` (`App.tsx:62-68`) dùng nhãn eyebrow nên không đổi.
- Thêm comment `// ĐỀ XUẤT — duyệt 23/10/2026` cạnh tagline, theo quy ước ở đầu `wedding.ts`.

---

## 2. Bộ chibi (bước 2)

### 2.1 Phong cách
- Vẽ lại theo ảnh mẫu: đầu to khoảng 45% chiều cao, mắt nâu to có hai đốm sáng, má hồng, miệng cười nhỏ. Cô dâu tóc dài gợn sóng, có vòng hoa và voan. Chú rể có lọn tóc vểnh.
- Nét viền mảnh và đều, không dùng gradient phức tạp. Bóng đổ chỉ là một mảng màu phẳng bên dưới chân, **không dùng filter SVG** vì filter gây giật trên điện thoại.
- Đổi màu theo palette của trang: vest đen trong ảnh mẫu chuyển sang nâu mocha, phụ kiện vàng.

### 2.2 Design tokens mới (`src/styles/tokens.css`)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--chibi-ink` | `#3b2c22` | Nét viền, mắt, miệng |
| `--chibi-stroke` | `1.4` (đơn vị viewBox) | Độ dày nét. Ở 160px cao ra khoảng 1.1px |
| `--chibi-skin` | `#f7e1cc` | Da |
| `--chibi-cheek` | `#eebaa0` | Má |
| `--chibi-hair-groom` | `#8c5b37` | Tóc chú rể |
| `--chibi-hair-bride` | `#b8864f` | Tóc cô dâu |
| `--chibi-suit` | `var(--color-mocha)` (#6e5a4b) | Vest, quần |
| `--chibi-cloth` | `#fffaf3` | Váy, sơ mi, cà vạt |
| `--chibi-veil` | `rgb(255 250 243 / .72)` | Voan |
| `--chibi-accent` | `var(--color-gold)` | Vòng hoa, cúc áo, đạo cụ |
| `--chibi-shadow` | `rgb(48 39 32 / .12)` | Bóng elip dưới chân |
| `--chibi-feature` | `#3b2c22` | Mắt, mày, miệng — giữ tối cả trên nền ánh nến (thêm khi làm) |
| `--chibi-iris` | `#8a5a34` | Tròng mắt nâu (thêm khi làm) |
| `--chibi-shoe` | `#3b2c22` | Giày (thêm khi làm) |
| `--chibi-h-sm` / `-md` / `-lg` | `clamp(88px, 24vw, 112px)` / `clamp(120px, 32vw, 168px)` / `clamp(168px, 16vw, 232px)` | Chiều cao nhân vật |

Ở `[data-light='candle']` (Gift, nền espresso): `--chibi-ink: #f3e6cf` để có viền sáng tách nhân vật khỏi nền tối, `--chibi-shadow: rgb(0 0 0 / .25)`.

### 2.3 Rig (khung xương)
Mỗi nhân vật là một `<svg viewBox="0 0 120 200">`, mặt đất ở y=196. Mỗi bộ phận là một `<g data-part>`, có pivot riêng để GSAP xoay bằng `svgOrigin`:

| Part | Pivot | Chuyển động |
|---|---|---|
| `root` | (60,196) | Dịch chuyển, nhún, nghiêng người |
| `upper` (thân trên + đầu + tay) | hông (60,140) | Cúi chào, đẩy cửa |
| `head` | cổ (60,104) | Nghiêng đầu, tựa vai |
| `face` | — | Dịch x ±4 để giả quay đầu nhìn trái/phải |
| `eyes` | — | 3 biến thể con `open` / `closed` / `happy` (^^). Đổi bằng `autoAlpha` |
| `arm-l`, `arm-r` | vai (±18 quanh 60, 118) | Biến thể `down` / `hold` (nắm tay nhau) / `point` / `up` (tay tim) / `carry` (cầm đạo cụ) |
| `leg-l`, `leg-r` (chú rể) | hông | Bước chạy |
| `skirt` (cô dâu) | eo | Đung đưa bằng `skewX` ±3° khi chạy |
| `veil` (cô dâu) | đỉnh đầu | Bay theo quán tính |
| `tuft` (chú rể) | chân tóc | Nảy |

**Hai lớp biến (sửa lỗi mất mắt, 23/10/2026):** React đặt tư thế cuối thành `--pose-*`; CSS đọc `var(--x, var(--pose-x))`; GSAP chỉ tween `--x` (khởi tạo bằng `rig()`, đi về tư thế cuối bằng `toPose()` — không dùng `gsap.from` cho biến rig). Khi GSAP dọn animation (StrictMode, đổi matchMedia) nó xoá `--x` và nhân vật rơi về đúng tư thế, thay vì về 0.

**Quy tắc tư thế mặc định:** markup render sẵn **tư thế cuối** của mỗi cảnh qua prop `pose`, animation dùng `from`. Nhờ vậy khi giảm chuyển động, khi không tải được JS hoặc khi chunk motion lỗi, khách vẫn thấy hình đúng. Cách này giống các scene hiện có.

### 2.4 Components (`src/components/chibi/`)

| Component | Props | Ghi chú |
|---|---|---|
| `Chibi` | `who: 'groom' \| 'bride'`, `pose: 'stand' \| 'hold' \| 'peek' \| 'carry' \| 'point' \| 'heart'`, `size: 'sm' \| 'md' \| 'lg'`, `look?: 'left' \| 'right' \| 'front'`, `className`, `data-anim` | Luôn có `aria-hidden="true"`, `focusable="false"`, `pointer-events:none` |
| `ChibiCouple` | `pose`, `size`, `lean?: boolean` (cô dâu tựa vai), `children?` (đạo cụ) | Chú rể bên trái, cô dâu bên phải, khớp `order: 'groom-first'`. Khi `pose='hold'` hai tay chạm nhau ở giữa |
| `ChibiProp` | `kind: 'calendar' \| 'map' \| 'envelope' \| 'mailbox' \| 'heart' \| 'petal'`, `label?: string` | `label` dùng cho số ngày trên tờ lịch (lấy từ dữ liệu) |
| `chibiArt.ts` | — | Path data, theo cách `src/scenes/Opening/doorArt.ts` đang làm |
| `Chibi.module.css` | — | Chỉ đọc biến `--chibi-*` |

### 2.5 Thư viện động tác (`src/motion/chibi.ts`, nằm trong chunk motion)
Mỗi hàm nhận phần tử và trả về một `gsap.core.Timeline` để ghép vào timeline của scene:

| Hàm | Mô tả | Thời lượng | Easing |
|---|---|---|---|
| `blink(el)` | `open` → `closed` → `open` | 0.15s | `steps(1)` |
| `blinkLoop(el)` | Chớp ngẫu nhiên mỗi 2.8–5s | lặp | — |
| `lookAround(el)` | `face` x −4 → +4 → 0, đầu xoay ±6° | 1.6s | `silk` |
| `bob(el)` | `root` y −3px yoyo | 2.4s/chu kỳ | `sine.inOut` |
| `run(el, fromX, toX)` | `root` x, chân/váy xen kẽ 0.12s, nảy y −4 | 0.5s | `power2.out` |
| `bow(el)` | `upper` rotate 28° (chú rể) / 24° (cô dâu), giữ 0.3s, về | 1.1s | `paper` |
| `heartHands(el)` | Cả hai tay đổi sang biến thể `up`, mắt `happy` | 0.6s | `back.out(1.6)` |
| `wave(el)` | `arm-r` biến thể `up`, xoay ±14°, ×2 | 0.9s | `sine.inOut` |
| `point(el)` | `arm` biến thể `point`, nhích 4px | 0.4s | `paper` |
| `floatUp(els)` | Tim/cánh hoa: y −60, x lệch ±12, mờ dần | 1.6s, stagger 0.2 | `power1.out` |

**Hiệu năng:**
- Chỉ animate `transform`, `opacity` và `autoAlpha` của `<g>` hoặc của wrapper HTML. Dịch chuyển cả người (chạy, nhún) đặt trên wrapper `<div>` có `will-change: transform`. Xoay bộ phận chỉ chạy khi nhân vật đứng yên.
- Vòng lặp (chớp mắt, nhún) dừng khi nhân vật ra khỏi khung nhìn (`ScrollTrigger` `onToggle`) và khi `document.hidden`.
- Mọi timeline đi qua `guard()` (`src/lib/gsap.ts:36`).

---

## 3. Storyboard từng cảnh (bước 3 + 4)

Thời gian tính bằng giây, cùng thang với `DUR` (`gsap.ts:20`). Easing dùng tên đã đăng ký `paper` và `silk`.

### 3.1 Màn mở đầu: hai bạn đứng trước cửa (cập nhật 23/10/2026)
- **Bố cục:** hai chibi đứng hẳn bên ngoài, phía trước cửa, ở hai bên nút “Mở thiệp” (`.hosts`, đáy màn hình). Khoảng giữa `clamp(168px, 50vw, 400px)` luôn đủ chỗ cho nút; chibi cao `min(clamp(100px, 34vw, 210px), 30svh)`. Lớp DOM nằm trên canvas 3D nên dùng chung cho bản 2.5D và 3D. Cánh cửa không còn tên hay chibi.
- *Đã bỏ:* hai cái đầu ló ở mép màn hình, hai chibi chạy vào, chibi in trên cánh cửa.
- **Intro** (`introDoors`): 1.0s hai bạn bước ra (y 18 → 0, lệch nhau 0.12s), 1.8s nhìn quanh, 3.1s chớp mắt.
- **Đứng chờ:** thở nhẹ liên tục (`--body-y` −3px, 1.3s) + chuỗi cử chỉ lặp ~7s: chớp mắt → quay sang nhìn nhau cười, nghiêng đầu, tóc chú rể nảy → nhìn quanh → lần lượt vẫy tay chào khách → nhún chân. Dừng khi khách bấm mở.
- **Giảm chuyển động:** hai bạn đứng yên.

### 3.2 Bấm “Mở thiệp”: đi ra mở cửa và mời vào
Overlay tan lúc 2.4s (trước là 2.0s) để kịp cảnh mời; chạm lần nữa vẫn tua nhanh ×3.

| t | Diễn biến |
|---|---|
| 0–0.2 | Quay sang nhìn nhau, mắt cười |
| 0.05–0.55 | Đi vào giữa tới sát khe cửa (chân bước, người nảy) |
| 0.55–0.85 | Đưa hai tay đẩy cánh cửa của mình, người nghiêng ra ngoài — cửa bắt đầu xoay lúc 0.6 |
| 1.15–1.6 | Lùi ra hai bên, nhường lối vào |
| 1.6–2.15 | Đưa tay về phía cửa đã mở, nghiêng đầu, cúi chào mời khách vào |
| 2.4–2.9 | Overlay tan, bìa hiện |

- **Bản 3D:** `openHosts` chạy cùng timeline cho hai bạn trên canvas.

### 3.3 Bìa (`Hero`, chỉ ở biến thể stationery)
- **Bố cục:**
  - ≥1024px: `ChibiCouple` cỡ `lg` đặt `position:absolute` bên phải `.frame` (frame rộng 600px, căn giữa), `top: 34%` — ngang tên viết tay, luôn trong màn hình đầu.
  - <1024px: **chú rể | tagline | cô dâu** trên một hàng (khối cặp đôi `display: contents`, mỗi nhân vật cao 76px). *Đã đổi khi làm:* đặt cặp đôi dưới tagline làm bìa cao 891px trên 375×812 và đẩy “Cuộn xuống” ra khỏi màn hình; xếp hai bên tagline thì bìa vừa đúng 812px.
  - Màn hình thấp (<1024px và `max-height: 640px`): ẩn chibi để giữ tên và ngày trọn trong `100svh`.
  - Biến thể bìa ảnh (`cover` có ảnh) **không có chibi**, vì ảnh thật đã là điểm nhấn cảm xúc.
- **Motion** (thêm vào cuối `heroMotion.ts`, chạy sau tên và tagline): cặp đôi nhô lên (y 24 → 0, `autoAlpha`, 0.6s, `paper`). Ở +0.3s cô dâu nghiêng đầu 8° và nhích x −3 để tựa vai chú rể. Ở +0.5s là `floatUp` 5 tim/cánh hoa vàng. Sau đó chỉ còn `bob` và `blinkLoop`.

### 3.4 Thông tin lễ và lịch (`Details`)
- **Bố cục:**
  - ≥640px: chú rể đứng bên trái `MonthCalendar`, cô dâu bên phải (cỡ `md`), ngoài bề rộng 360px của bảng.
  - <640px: `ChibiCouple size="sm"` thành một hàng ngay trên bảng lịch, không chồng lên ô ngày.
- **Đạo cụ:** mỗi người cầm một `ChibiProp kind="calendar"`. Số ngày lấy từ `content.days` đã sắp xếp: chú rể cầm ngày đầu (23), cô dâu cầm ngày chính (24). Nếu chỉ có một ngày thì chú rể cầm tờ lịch, cô dâu đứng nhìn sang.
- **Motion** (ScrollTrigger trên `MonthCalendar`, `top 80%`, `once`): nhô lên 0.6s → giơ tờ lịch (`carry`, 0.4s) → khi vòng tròn tay vẽ quanh ngày chính xong (khớp với `drawIn` trong `detailsMotion.ts:39-50`), hai bạn quay mặt nhìn nhau (`face` x ±4) và mắt `happy` 0.4s → giữ nguyên, không lặp.

### 3.5 Địa điểm và bản đồ (`Locations` / `StylizedMap`)
- **Bố cục:** hai chibi tí hon (cao khoảng 40 đơn vị viewBox) nằm **bên trong SVG bản đồ** (`StylizedMap.tsx`), dưới dạng `<svg>` lồng. Vì vậy nhân vật không bao giờ ra khỏi `figure` bản đồ và không chạm thẻ địa điểm hay nút “Chỉ đường”.
- **Motion:**
  - Mất 2.4s. Hai bạn đi dọc tuyến nét đứt từ ghim đầu đến ghim cuối, đồng bộ với `route` mask đang được vẽ.
  - Toạ độ lấy bằng `path.getPointAtLength()` trong `onUpdate`, không cần thêm MotionPathPlugin.
  - Tới nơi: nảy nhẹ, tim nhỏ bật lên trên ghim. Cô dâu `point` về phía danh sách thẻ (bên phải trên desktop, xuống dưới trên mobile). Chú rể mở `ChibiProp kind="map"` (scaleX 0 → 1, 0.4s).
  - Có 1 địa điểm: đi từ mép trái vào ghim. Không có địa điểm (đang hiện `PendingNote`): không render.

### 3.6 Lời cảm ơn (`Gift` → `footer.closing`)
- **Bố cục:** chú rể bên trái, cô dâu bên phải dấu sáp 104px (`Gift.tsx:76`), cỡ `md`. Ở <380px thì thu xuống cỡ `sm`.
- **Motion** (trigger `closing`, `top 85%`, `once`, sau khi dấu sáp rơi xuống trong `giftMotion.ts:43-53`): nhô lên → cả hai `bow` (lệch nhau 0.1s) → `heartHands` → giữ 1.2s → cô dâu `wave` một lần → đứng yên với `blinkLoop`.

### 3.7 Quà mừng: phong thư (`Gift` → `.gifts`)
- **Bố cục:** một hoạt cảnh nhỏ cao 72px ngay dưới h3 “Gửi quà mừng”, gồm hộp thư bên phải và phong thư. **Không đặt gì lên GiftCard hay QR.** Theo spec gốc, QR không được có transform, blur hay opacity.
- **Vào khung nhìn:** phong thư bay theo đường cong từ trái vào khe hộp thư (x −120 → 0, y cung −30, xoay −10° → 0°, 0.9s, `silk`). Cờ hộp thư bật lên (`back.out(2)`).
- **Khi bấm nút:** “Sao chép STK” hoặc “Sao chép toàn bộ” sao chép thành công, hoặc khách bấm “Lưu ảnh QR”. Khi đó phong thư bật ra khỏi hộp, nắp mở (scaleY 1 → −1), một trái tim vàng bay lên (`floatUp`), tổng 0.8s.
  - Trong lúc hoạt cảnh đang chạy thì bỏ qua các lần bấm tiếp theo.
  - Toast `aria-live` hiện có vẫn là phản hồi chính cho người dùng trình đọc màn hình.
- **Tích hợp:**
  - Thêm prop `onCopied?: () => void` vào `CopyButton` (`src/components/CopyButton.tsx:6`) và `onAction?` vào `GiftCard`.
  - `Gift.tsx` gọi `loadMotion().then(r => r.giftCelebrate(el))` khi `prefersMotion()`.
  - Export `giftCelebrate` và `chibiOpen` qua `src/motion/runtime.ts`.

---

## 4. Responsive

| Breakpoint | Thay đổi |
|---|---|
| <640px (gốc 390×844) | Hero: chibi hai bên tagline. Details: hàng chibi trên lịch. Map: chibi trong bản đồ. Footer: hai bên dấu sáp |
| 640–1023px | Details: chibi hai bên lịch. Hero vẫn trong luồng |
| ≥1024px | Hero: chibi `lg` tuyệt đối bên phải frame |
| <1024px và `max-height: 640px` | Ẩn chibi ở Hero |
| `max-height: 500px` | Màn mở đầu: đầu ló thu nhỏ; hai bạn chạy vào cao tối đa 30svh |

## 5. Trường hợp biên
- **Giảm chuyển động / không có JS / chunk motion lỗi:** hiện tư thế cuối tĩnh, không vòng lặp. Màn mở đầu dùng nhánh `fadeOut` sẵn có.
- **Bản 3D (`?mocua=3d`):** lớp chibi là DOM nằm trên canvas nên chạy giống bản 2.5D. Mất WebGL context không ảnh hưởng chibi.
- **Deep link** (`#dia-diem`…) bỏ qua màn mở: chibi ở các scene vẫn chạy theo ScrollTrigger. “Xem lại thiệp mở” mount lại `Opening` thì chibi reset.
- **Tên dài:** chibi không phụ thuộc vào độ dài tên. Tiêu đề Details xuống dòng tự nhiên, SplitText dùng mask có padding chống cắt dấu.
- **Thiếu dữ liệu:** không có ngày thứ hai thì dùng một tờ lịch. Không có địa điểm thì không có chibi trên bản đồ. Không có tài khoản thì không có hộp thư.
- **Webview Zalo/Messenger, mạng chậm:** art SVG nằm sẵn trong bundle, không phát sinh request mới.

## 6. Accessibility
- Mọi SVG chibi và đạo cụ có `aria-hidden="true"` và `focusable="false"`. Không có thông tin nào chỉ nằm trong hình: số ngày trên tờ lịch đã có trong `DateBlock`.
- Không thay đổi thứ tự focus và không thêm điểm dừng tab.
- `pointer-events:none` trên mọi lớp chibi, cộng với kiểm tra tự động: tâm của mọi `button` và `a` vẫn trả về chính phần tử đó qua `elementFromPoint`.
- Vòng lặp chậm (≥2.4s), không nhấp nháy, dừng khi ra khỏi khung nhìn hoặc khi tab ẩn. Tôn trọng `prefers-reduced-motion` qua `prefersMotion()` và `gsap.matchMedia`.

## 7. Ngân sách hiệu năng
- Chunk ban đầu tăng ≤ 10 KB gz (art + components). Hiện khoảng 83 KB, trần là 120 KB.
- Chunk motion tăng ≤ 4 KB gz.
- Trong lúc cửa mở trên điện thoại chỉ animate transform/opacity của wrapper. `holdPaint` vẫn giữ như cũ.

---

## 8. Thứ tự thực hiện

1. Viết `docs/handoff-chibi.md`: bản spec này, bỏ phần Context và Verification.
2. Đổi tiêu đề và tagline (mục 1).
3. Thêm tokens `--chibi-*` và viết `src/components/chibi/` (art, `Chibi`, `ChibiCouple`, `ChibiProp`). Dựng tạm một trang xem thử ở dev (`?chibi=sheet`, chỉ khi `import.meta.env.DEV`) để duyệt mọi tư thế, rồi gỡ trước khi commit.
4. Viết `src/motion/chibi.ts` (thư viện động tác).
5. Ba cảnh chính: ló đầu (3.1), chạy mở cửa (3.2), cúi chào cuối trang (3.6).
6. Các cảnh còn lại: Bìa (3.3), Lịch (3.4), Bản đồ (3.5), Phong thư (3.7).
7. Rà soát trên điện thoại và chế độ giảm chuyển động (mục Verification).
8. Cập nhật memory `wedding-site-plan.md`.

**File chính:**
- Thêm mới: `src/components/chibi/*`, `src/motion/chibi.ts`, `docs/handoff-chibi.md`
- Sửa: `src/styles/tokens.css`, `src/content/wedding.ts`, `src/scenes/{Opening,Hero,Details,Locations,Gift}/*` (TSX, CSS module, `*Motion.ts`), `src/scenes/Locations/StylizedMap.tsx`, `src/scenes/Gift/GiftCard.tsx`, `src/components/CopyButton.tsx`, `src/motion/runtime.ts`

**Tái sử dụng:** `guard`, `riseIn`, `DUR`, `MEDIA` (`src/lib/gsap.ts`); `useSceneMotion` / `loadMotion` / `prefersMotion` (`src/motion/useMotion.ts`); `orderedCouple`, `primaryDay` (`src/lib/format.ts`); cách tổ chức path data của `doorArt.ts`.

