/** Shared, font-independent artwork for the DOM, WebGL, favicon and share card. */
export const SEAL_INK = '#765630'
export const SEAL_LEAF = '#ad8955'
export const SEAL_RINGS = [
  { r: 47, stroke: '#b99560', width: 1 },
  { r: 43.5, stroke: '#d0b78f', width: 0.5 },
  { r: 37.5, stroke: '#ad8955', width: 0.55 },
] as const
export const SEAL_BRANCH = 'M29 73C14 63 13 44 25 29M23 66C16 65 14 60 15 56C21 57 24 61 23 66M19 55C13 52 12 48 15 44C20 47 21 51 19 55M20 43C16 37 18 33 22 31C25 36 24 40 20 43M24 33C23 27 27 24 31 23C31 28 28 32 24 33'
// Interlocking N and T. Outlines stay crisp and consistent without waiting for fonts.
export const SEAL_N = 'M31 61V35H33L53 58V35M27 35H37M27 61H35M49 35H57'
export const SEAL_T = 'M47 45H72M47 45V51M72 45V51M59.5 45V69M54 69H65'
export const SEAL_AMP = 'M62 34C58 31 56 29 58 26C60 23 65 25 63 28C61 31 56 32 57 36C58 40 65 39 68 33M61 30L68 38'
export const SEAL_SPARK = 'M50 17L51.5 21.5L56 23L51.5 24.5L50 29L48.5 24.5L44 23L48.5 21.5Z'

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!)

export function sealMarkup(id: string, monogram = 'N & T') {
  const letters = monogram.replace(/\s/g, '').toUpperCase() === 'N&T'
    ? `<g fill="none" stroke="${SEAL_INK}" stroke-linecap="round" stroke-linejoin="round"><path d="${SEAL_N}" stroke-width="1.35"/><path d="${SEAL_T}" stroke-width="1.5"/><path d="${SEAL_AMP}" stroke-width="0.85"/></g>`
    : `<text x="50" y="56" text-anchor="middle" font-family="Georgia,serif" font-size="19" fill="${SEAL_INK}">${escape(monogram)}</text>`
  return `<defs><linearGradient id="${id}-paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffaf0"/><stop offset="0.55" stop-color="#f4e8d4"/><stop offset="1" stop-color="#e1cba8"/></linearGradient></defs>
  <circle cx="50" cy="50" r="48" fill="url(#${id}-paper)"/>
  ${SEAL_RINGS.map(({r,stroke,width}) => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`).join('')}
  <g fill="none" stroke="${SEAL_LEAF}" stroke-width="0.65" stroke-linecap="round" stroke-linejoin="round"><path d="${SEAL_BRANCH}"/><path d="${SEAL_BRANCH}" transform="translate(100 0) scale(-1 1)"/></g>
  <path d="${SEAL_SPARK}" fill="${SEAL_LEAF}"/>
  ${letters}<path d="M42 78H58" stroke="${SEAL_LEAF}" stroke-width="0.7"/><circle cx="50" cy="82" r="1" fill="${SEAL_LEAF}"/>`
}

export const sealSvg = (id: string, monogram = 'N & T') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${sealMarkup(id, monogram)}</svg>`
