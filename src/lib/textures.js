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
      const px = pixel(x, y, r)
      if (!px) continue // transparent
      const [R, G, B] = px
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
    birchSide: () =>
      paint(28, (x, y, r) => {
        const mark = (y % 6 === 2 && x > 3 && x < 9) || (y % 7 === 5 && x > 9 && x < 13)
        return mark ? vary([40, 40, 36], r, 10) : vary([216, 214, 204], r, 14)
      }),
    birchTop: () =>
      paint(29, (x, y, r) => {
        const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))
        if (d > 6.5) return vary([216, 214, 204], r, 14)
        return vary(Math.floor(d) % 2 ? [200, 184, 130] : [182, 166, 116], r, 12)
      }),
    birchLeaves: () => paint(30, (x, y, r) => (r() < 0.18 ? vary([70, 104, 46], r, 20) : vary([112, 156, 76], r, 40))),
    snowLeaves: () => paint(31, (x, y, r) => (r() < 0.25 ? vary(shade(p.leaves, 0.8), r, 20) : vary(SNOW, r, 12))),
    // Plants: drawn on transparent canvases and shown as two crossed planes
    tallGrass: () =>
      paint(32, (x, y, r) => {
        const blade = 4 + ((x * 7 + 3) % 9) // per-column blade height
        return x % 2 === 0 && 15 - y < blade ? vary(p.grass, r, 36) : null
      }),
    fern: () =>
      paint(33, (x, y, r) => {
        const dx = Math.abs(x - 7.5)
        const frond = y > 3 && dx < (16 - y) * 0.55 && (x + y) % 3 !== 0
        return frond ? vary(shade(p.leaves, 1.1), r, 30) : null
      }),
    poppy: () =>
      paint(34, (x, y, r) => {
        if (y >= 9 && (x === 7 || (y === 11 && x === 8))) return vary([60, 120, 40], r, 16)
        if (y >= 4 && y <= 8 && Math.abs(x - 7.5) + Math.abs(y - 6) < 3.2) return vary(y < 6 ? [214, 36, 30] : [180, 24, 24], r, 18)
        return null
      }),
    dandelion: () =>
      paint(35, (x, y, r) => {
        if (y >= 10 && x === 7) return vary([70, 130, 44], r, 16)
        if (y >= 6 && y <= 9 && x >= 6 && x <= 9) return vary([246, 210, 40], r, 22)
        return null
      }),
    deadBush: () =>
      paint(36, (x, y, r) => {
        const branch =
          (y >= 12 && x === 7) ||
          (y >= 6 && y < 12 && (x === 7 - Math.floor((12 - y) / 2) || x === 8 + Math.floor((12 - y) / 2))) ||
          (y >= 4 && y < 8 && x === 7)
        return branch ? vary([120, 82, 40], r, 22) : null
      }),
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
