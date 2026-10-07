// Procedural 16×16 pixel textures — drawn in code so no game assets are used.

export function rng(seed) {
  let s = seed % 2147483647 || 1
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const SIZE = 16
const clamp = (v) => Math.max(0, Math.min(255, v | 0))
const vary = (base, r, amt) => {
  const n = (r() - 0.5) * amt
  return base.map((v) => clamp(v + n))
}

function paint(seed, pixel) {
  const c = document.createElement('canvas')
  c.width = c.height = SIZE
  const g = c.getContext('2d')
  const r = rng(seed)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [R, G, B] = pixel(x, y, r)
      g.fillStyle = `rgb(${R},${G},${B})`
      g.fillRect(x, y, 1, 1)
    }
  }
  return c
}

const GRASS = [96, 160, 56]
const DIRT = [134, 96, 67]

export const textures = {
  stone: () => paint(11, (x, y, r) => vary([126, 126, 126], r, r() < 0.1 ? 70 : 30)),
  dirt: () => paint(12, (x, y, r) => vary(DIRT, r, r() < 0.15 ? 60 : 26)),
  grassTop: () => paint(13, (x, y, r) => vary(GRASS, r, 46)),
  grassSide: () => {
    const edge = Array.from({ length: SIZE }, (_, i) => 3 + ((i * 7) % 3 === 0 ? 1 : 0))
    return paint(14, (x, y, r) => (y < edge[x] ? vary(GRASS, r, 40) : vary(DIRT, r, 26)))
  },
  sand: () => paint(15, (x, y, r) => vary([219, 206, 160], r, 22)),
  logSide: () => paint(16, (x, y, r) => vary(x % 4 === 0 ? [78, 60, 36] : [106, 84, 52], r, 18)),
  logTop: () =>
    paint(17, (x, y, r) => {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))
      if (d > 6.5) return vary([106, 84, 52], r, 18)
      return vary(Math.floor(d) % 2 ? [168, 136, 86] : [150, 120, 74], r, 14)
    }),
  leaves: () => paint(18, (x, y, r) => (r() < 0.18 ? vary([34, 74, 24], r, 20) : vary([58, 120, 38], r, 44))),
  water: () => paint(19, (x, y, r) => vary([54, 98, 214], r, 22)),
  // UI textures
  button: () => paint(20, (x, y, r) => vary([112, 112, 112], r, 26)),
  logo: () =>
    paint(21, (x, y, r) => {
      const crack = (x * 3 + y * 5) % 13 === 0 && r() < 0.5
      return crack ? vary([168, 160, 153], r, 10) : vary([206, 199, 192], r, 14)
    }),
}

// Expose UI textures to CSS as custom properties (pixelated via image-rendering).
export function installCssTextures() {
  const root = document.documentElement.style
  root.setProperty('--tex-button', `url(${textures.button().toDataURL()})`)
  root.setProperty('--tex-logo', `url(${textures.logo().toDataURL()})`)
}
