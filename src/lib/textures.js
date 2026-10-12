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
const shade = (c, f) => c.map((v) => clamp(v * f))

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

const DIRT = [134, 96, 67]
const SNOW = [238, 243, 250]
const SAND = [219, 206, 160]
const edge = Array.from({ length: SIZE }, (_, i) => 3 + ((i * 7) % 3 === 0 ? 1 : 0))

// Block textures, tinted by a biome palette (grass, leaves, bark, ring)
export function worldTextures(p) {
  return {
    stone: () => paint(11, (x, y, r) => vary([126, 126, 126], r, r() < 0.1 ? 70 : 30)),
    dirt: () => paint(12, (x, y, r) => vary(DIRT, r, r() < 0.15 ? 60 : 26)),
    grassTop: () => paint(13, (x, y, r) => vary(p.grass, r, 46)),
    grassSide: () => paint(14, (x, y, r) => (y < edge[x] ? vary(p.grass, r, 40) : vary(DIRT, r, 26))),
    snow: () => paint(22, (x, y, r) => vary(SNOW, r, 12)),
    snowSide: () => paint(23, (x, y, r) => (y < edge[x] + 1 ? vary(SNOW, r, 12) : vary(DIRT, r, 26))),
    sand: () => paint(15, (x, y, r) => vary(SAND, r, 22)),
    sandstone: () => paint(24, (x, y, r) => vary(y % 5 === 4 ? [196, 180, 128] : [216, 200, 148], r, 14)),
    logSide: () => paint(16, (x, y, r) => vary(x % 4 === 0 ? shade(p.bark, 0.74) : p.bark, r, 18)),
    logTop: () =>
      paint(17, (x, y, r) => {
        const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))
        if (d > 6.5) return vary(p.bark, r, 18)
        return vary(Math.floor(d) % 2 ? p.ring : shade(p.ring, 0.88), r, 14)
      }),
    leaves: () => paint(18, (x, y, r) => (r() < 0.18 ? vary(shade(p.leaves, 0.6), r, 20) : vary(p.leaves, r, 44))),
    cactusSide: () =>
      paint(25, (x, y, r) => {
        if (x === 0 || x === 15) return vary([40, 96, 30], r, 10)
        if (x % 5 === 2 && y % 4 === 1) return [210, 220, 170] // spines
        return vary(x % 5 === 2 ? [62, 124, 42] : [82, 150, 56], r, 16)
      }),
    cactusTop: () => paint(26, (x, y, r) => vary((x + y) % 4 === 0 ? [62, 124, 42] : [92, 162, 62], r, 14)),
    water: () => paint(19, (x, y, r) => vary([54, 98, 214], r, 22)),
    ice: () => paint(27, (x, y, r) => vary(r() < 0.08 ? [200, 220, 250] : [146, 182, 238], r, 18)),
  }
}

const ui = {
  button: () => paint(20, (x, y, r) => vary([112, 112, 112], r, 9)),
}

// Expose UI textures to CSS as custom properties (pixelated via image-rendering).
export function installCssTextures() {
  const root = document.documentElement.style
  root.setProperty('--tex-button', `url(${ui.button().toDataURL()})`)
}
