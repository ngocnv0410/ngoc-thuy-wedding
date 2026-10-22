/*
 * Vẽ hoạ tiết trang trí thành bitmap, một lần, lúc trình duyệt rảnh.
 *
 * Hoa baby (hàng nghìn chấm) và nền loang (filter nhiễu, làm mờ) để dạng SVG thì trình duyệt phải
 * rasterize lại theo từng ô mỗi khi cuộn tới — trên điện thoại DPR 3 là giật hàng trăm ms mỗi khung.
 * Vẽ vào <canvas> thì chỉ tốn một lần; cuộn chỉ là ghép ảnh trên GPU.
 */

type Job = () => Promise<void> | void

const queue: Job[] = []
let running = false
/** Đang có animation quan trọng (màn mở cửa): việc vẽ chờ tới mốc này. */
let heldUntil = 0

/** Hoãn việc vẽ trong `ms` tới — mỗi việc vẽ là một tác vụ dài, chạy giữa animation sẽ làm giật. */
export function holdPaint(ms: number) {
  heldUntil = Math.max(heldUntil, performance.now() + ms)
}

const idle = (callback: () => void) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 800 })
  else setTimeout(callback, 16)
}

function pump() {
  const job = queue.shift()
  if (!job) {
    running = false
    return
  }
  const run = () => {
    const wait = heldUntil - performance.now()
    if (wait > 0) {
      setTimeout(() => idle(run), wait)
      return
    }
    Promise.resolve()
      .then(job)
      .catch(() => {})
      .finally(pump)
  }
  idle(run)
}

/** Xếp hàng một việc vẽ; các việc chạy lần lượt, mỗi việc một khoảng rảnh (theo thứ tự gắn — bìa trước). */
export function queuePaint(job: Job): () => void {
  let cancelled = false
  queue.push(() => (cancelled ? undefined : job()))
  if (!running) {
    running = true
    pump()
  }
  return () => {
    cancelled = true
  }
}

/** Nạp chuỗi SVG thành ảnh đã giải mã, sẵn để vẽ lên canvas. */
export async function loadSvg(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Rasterize chuỗi SVG lên canvas ở đúng kích thước pixel (w × h). */
export async function drawSvg(canvas: HTMLCanvasElement, svg: string, w: number, h: number) {
  const image = await loadSvg(svg)
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')?.drawImage(image, 0, 0, w, h)
}

/** Mật độ điểm ảnh cho bitmap trang trí: theo màn hình nhưng tối đa ×2 (không ai thấy khác, đỡ bộ nhớ). */
export const paintDensity = () => Math.min(window.devicePixelRatio || 1, 2)
