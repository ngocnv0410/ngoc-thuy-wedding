/**
 * Hoạ tiết nổi trên hai cánh cửa mở đầu — một nguồn dùng chung cho bản 2.5D (SVG) và bản 3D
 * (vẽ lên canvas làm texture + normal map), nên hai bản khớp nhau từng nét.
 *
 * Toạ độ của cánh TRÁI trong khung ART_W × ART_H; khe cửa ở phía phải (x lớn). Cánh phải là
 * ảnh soi gương. Khung hoạ tiết đặt giữa cánh, co theo kiểu "contain" (xem artBox).
 */
export const ART_W = 400
export const ART_H = 900

/** Thanh ngang giữa hai ô — trùng giữa màn hình, nơi dấu sáp nằm trên khe cửa. */
export const RAIL_Y = 450

/** Tỉ lệ khung hoạ tiết so với cánh cửa (rộng × cao tối đa). */
export const ART_FIT = { width: 0.84, height: 0.9 } as const

export interface Relief {
  d: string
  /** Có: nét nổi (gờ chỉ) với độ rộng này; không: mảng nổi. */
  stroke?: number
}

/** Vị trí khung hoạ tiết trong một cánh cửa (đơn vị bất kỳ, cùng đơn vị với doorW/doorH). */
export function artBox(doorW: number, doorH: number) {
  const scale = Math.min((doorW * ART_FIT.width) / ART_W, (doorH * ART_FIT.height) / ART_H)
  return { scale, x: (doorW - ART_W * scale) / 2, y: (doorH - ART_H * scale) / 2 }
}

const f = (n: number) => +n.toFixed(1)

/** Cánh hoa hình hạt hạnh nhân từ tâm (cx, cy) theo góc a, dài len. */
function petal(cx: number, cy: number, a: number, len: number, width = 0.32): string {
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const pt = (along: number, side: number) => `${f(cx + cos * along - sin * side)} ${f(cy + sin * along + cos * side)}`
  const w = len * width
  return `M${pt(0, 0)}C${pt(len * 0.3, w)} ${pt(len * 0.8, w * 0.8)} ${pt(len, 0)}C${pt(len * 0.8, -w * 0.8)} ${pt(len * 0.3, -w)} ${pt(0, 0)}Z`
}

function circle(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(r * 2)} 0a${r} ${r} 0 1 0 ${f(-r * 2)} 0Z`
}

/** Hoa hồng tám cánh (kiểu hoa văn chạm) — cánh lớn, cánh nhỏ xen giữa, nhuỵ tròn. */
function rosette(cx: number, cy: number, r: number): Relief[] {
  const out: Relief[] = []
  for (let i = 0; i < 8; i++) out.push({ d: petal(cx, cy, (i * Math.PI) / 4 - Math.PI / 2, r) })
  for (let i = 0; i < 8; i++) out.push({ d: petal(cx, cy, (i * Math.PI) / 4 - Math.PI / 2 + Math.PI / 8, r * 0.62, 0.28) })
  out.push({ d: circle(cx, cy, r * 0.4), stroke: Math.max(1.5, r * 0.04) })
  out.push({ d: circle(cx, cy, r * 0.24) })
  return out
}

/** Dây leo cuộn chữ S, lá dọc thân, kết thúc bằng một vòng xoắn; side = -1 trái, 1 phải. */
function vine(cx: number, top: number, side: 1 | -1): Relief[] {
  const x = (dx: number) => f(cx + dx * side)
  const out: Relief[] = [
    {
      d: `M${x(0)} ${top}C${x(-28)} ${top + 26} ${x(-88)} ${top + 18} ${x(-96)} ${top - 14}C${x(-104)} ${top - 44} ${x(-72)} ${top - 54} ${x(-58)} ${top - 34}C${x(-50)} ${top - 22} ${x(-62)} ${top - 10} ${x(-72)} ${top - 20}`,
      stroke: 3.2,
    },
    {
      d: `M${x(-40)} ${top + 18}C${x(-40)} ${top + 50} ${x(-82)} ${top + 70} ${x(-108)} ${top + 56}`,
      stroke: 2.4,
    },
  ]
  const leaf = (dx: number, dy: number, angle: number, len: number) =>
    out.push({ d: petal(cx + dx * side, top + dy, side === 1 ? angle : Math.PI - angle, len, 0.36) })
  leaf(-20, 14, Math.PI * 0.62, 24)
  leaf(-64, 18, Math.PI * 0.42, 22)
  leaf(-100, 2, Math.PI * 0.95, 20)
  leaf(-60, 56, Math.PI * 0.55, 20)
  leaf(-92, 62, Math.PI * 0.85, 18)
  // Chùm baby li ti ở đầu nhánh.
  const dots: Array<[number, number, number]> = [
    [-110, 54, 4.2], [-118, 46, 3.4], [-116, 62, 3.2], [-124, 56, 2.8], [-106, 44, 2.6],
    [-82, -40, 3], [-88, -48, 2.4], [-76, -48, 2.2],
  ]
  for (const [dx, dy, r] of dots) out.push({ d: circle(cx + dx * side, top + dy, r) })
  return out
}

/** Quạt góc ô: ba cung đồng tâm ở góc (cx, cy), quay về phía trong ô theo (sx, sy). */
function cornerFan(cx: number, cy: number, sx: 1 | -1, sy: 1 | -1): Relief[] {
  return [12, 20, 28].map((r) => ({
    d: `M${f(cx + r * sx)} ${cy}A${r} ${r} 0 0 ${sx === sy ? 1 : 0} ${cx} ${f(cy + r * sy)}`,
    stroke: r === 28 ? 2 : 1.4,
  }))
}

/** Toàn bộ hoạ tiết nổi của cánh trái (mặt giấy, không gồm tên và vòng nắm mạ vàng). */
export const RELIEF: Relief[] = (() => {
  const out: Relief[] = []
  // Khung vòm: gờ lớn + chỉ trong.
  out.push({ d: 'M18 882V200A182 182 0 0 1 382 200V882Z', stroke: 9 })
  out.push({ d: 'M36 864V200A164 164 0 0 1 364 200V864Z', stroke: 2.4 })
  // Ô vòm phía trên: hoa hồng + hai dây leo.
  out.push({ d: 'M72 418V230A128 128 0 0 1 328 230V418Z', stroke: 3.6 })
  out.push({ d: 'M84 406V230A116 116 0 0 1 316 230V406Z', stroke: 1.4 })
  out.push(...rosette(200, 236, 58))
  out.push(...vine(200, 330, -1), ...vine(200, 330, 1))
  // Thanh giữa: chuỗi hạt.
  for (let x = 72; x <= 328; x += 16) out.push({ d: circle(x, RAIL_Y, x % 32 === 8 ? 4.6 : 3) })
  // Ô dưới: hai lớp chỉ, quạt bốn góc, hoa nhỏ dưới tên.
  out.push({ d: 'M72 482H328V846H72Z', stroke: 3.6 })
  out.push({ d: 'M86 496H314V832H86Z', stroke: 1.4 })
  out.push(...cornerFan(86, 496, 1, 1), ...cornerFan(314, 496, -1, 1), ...cornerFan(86, 832, 1, -1), ...cornerFan(314, 832, -1, -1))
  out.push(...rosette(200, 742, 20))
  for (const side of [-1, 1] as const) {
    out.push({ d: `M${200 + 28 * side} 742C${200 + 50 * side} 734 ${200 + 76 * side} 734 ${200 + 96 * side} 746`, stroke: 2 })
    out.push({ d: petal(200 + 56 * side, 736, side === 1 ? -Math.PI * 0.18 : Math.PI * 1.18, 16, 0.4) })
    out.push({ d: petal(200 + 78 * side, 740, side === 1 ? Math.PI * 0.12 : Math.PI * 0.88, 14, 0.4) })
  }
  return out
})()

/** Tên ép kim trong ô dưới (giữa ô, phía trên hoa nhỏ). */
export const NAME = { x: 200, y: 660 } as const

export function nameSize(name: string) {
  return Math.min(70, 560 / Math.max(4, [...name].length))
}

/** Vòng nắm cửa mạ vàng sát khe (giữa gờ khung và ô dưới). */
export const RING = { x: 352, y: 540, r: 17, plate: 9 } as const

/** Đổi toạ độ x của cánh trái sang cánh phải (soi gương). */
export const mirrorX = (x: number) => ART_W - x
