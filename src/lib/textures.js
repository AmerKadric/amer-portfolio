// Procedural 16×16 pixel textures — drawn in code so no game assets are used.
//
// Like hand-made pixel art, each block uses a small palette of distinct shades
// (a "ramp") rather than smooth noise, which is what keeps it crisp.

export function rng(seed) {
  let s = seed % 2147483647 || 1
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const SIZE = 16
const clamp = (v) => Math.max(0, Math.min(255, v | 0))
const shade = (c, f) => c.map((v) => clamp(v * f))

// A few shades of one colour, darkest first
const ramp = (base, factors) => factors.map((f) => shade(base, f))
// Pick a shade from a ramp with t in 0–1
const pick = (shades, t) => shades[Math.max(0, Math.min(shades.length - 1, Math.floor(t * shades.length)))]

// Smooth, seamlessly tiling 16×16 noise built from a coarse cells×cells grid
function tileNoise(seed, cells) {
  const r = rng(seed)
  const grid = Array.from({ length: cells * cells }, r)
  const at = (gx, gy) => grid[((gy + cells) % cells) * cells + ((gx + cells) % cells)]
  const step = SIZE / cells
  return (x, y) => {
    const fx = x / step, fy = y / step
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = fx - x0, ty = fy - y0
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx
    const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx
    return top * (1 - ty) + bottom * ty
  }
}

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

const DIRT = ramp([134, 96, 67], [0.66, 0.82, 1, 1.12])
const STONE = ramp([127, 127, 127], [0.68, 0.8, 0.92, 1.03, 1.13])
const SAND = ramp([219, 206, 160], [0.88, 0.94, 1, 1.04])
const SANDSTONE = ramp([216, 200, 148], [0.84, 0.92, 1, 1.05])
const SNOW = ramp([240, 245, 252], [0.9, 0.95, 1])
const BIRCH = ramp([222, 220, 210], [0.86, 0.93, 1])
const CACTUS = ramp([82, 150, 56], [0.62, 0.8, 1, 1.12])
const WATER = ramp([54, 98, 214], [0.84, 0.92, 1, 1.08])
const ICE = ramp([146, 182, 238], [0.9, 0.97, 1.05, 1.14])

// Dirt: mostly mid-brown with scattered darker and lighter specks
const dirtPixel = (r) => {
  const t = r()
  return DIRT[t < 0.14 ? 0 : t < 0.42 ? 1 : t < 0.9 ? 2 : 3]
}

// Per-column length of the green "drips" hanging down a grass block's side
const drips = (seed, base) => {
  const r = rng(seed)
  return Array.from({ length: SIZE }, () => base + Math.floor(r() * r() * 4))
}

// Block textures, tinted by a biome palette (grass, leaves, bark, ring)
export function worldTextures(p) {
  const GRASS = ramp(p.grass, [0.72, 0.84, 0.94, 1.04, 1.14])
  const LEAVES = ramp(p.leaves, [0.6, 0.76, 0.9, 1.04])
  const BARK = ramp(p.bark, [0.6, 0.76, 0.9, 1, 1.1])
  const RING = ramp(p.ring, [0.82, 0.92, 1, 1.08])
  const BIRCH_LEAVES = ramp([112, 156, 76], [0.62, 0.78, 0.92, 1.05])

  const leafPixel = (shades) => (x, y, r) => (r() < 0.2 ? null : pick(shades, r()))
  const ringsPixel = (bark, rings) => (x, y, r) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))
    if (d > 6.5) return pick(bark, r())
    return rings[(Math.floor(d) % 2 ? 2 : 0) + (r() < 0.5 ? 1 : 0)]
  }

  return {
    stone: () => {
      const blot = tileNoise(41, 4)
      return paint(11, (x, y, r) => pick(STONE, blot(x, y) * 0.65 + r() * 0.35))
    },
    dirt: () => paint(12, (x, y, r) => dirtPixel(r)),
    grassTop: () => {
      const patch = tileNoise(43, 8)
      return paint(13, (x, y, r) => pick(GRASS, patch(x, y) * 0.45 + r() * 0.55))
    },
    grassSide: () => {
      const len = drips(14, 2)
      return paint(14, (x, y, r) => (y < len[x] ? pick(GRASS, 0.2 + r() * 0.8) : dirtPixel(r)))
    },
    snow: () => paint(22, (x, y, r) => pick(SNOW, r() * 0.6 + 0.4 * ((x * 3 + y * 5) % 7) / 7)),
    snowSide: () => {
      const len = drips(23, 3)
      return paint(23, (x, y, r) => (y < len[x] ? pick(SNOW, r()) : dirtPixel(r)))
    },
    sand: () => paint(15, (x, y, r) => pick(SAND, r() < 0.1 ? 0 : 0.3 + r() * 0.7)),
    sandstone: () =>
      paint(24, (x, y, r) => {
        if (y < 3) return pick(SANDSTONE, 0.55 + r() * 0.45) // lighter cap
        if (y === 3 || y === 11) return SANDSTONE[0] // layer lines
        return pick(SANDSTONE, 0.25 + r() * 0.6)
      }),
    logSide: () => {
      const col = Array.from({ length: SIZE }, rng(16))
      return paint(16, (x, y, r) => pick(BARK, col[x] * 0.65 + r() * 0.35))
    },
    logTop: () => paint(17, ringsPixel(BARK, RING)),
    leaves: () => paint(18, leafPixel(LEAVES)),
    birchSide: () => {
      // white bark with short dark horizontal marks
      const marks = new Set()
      const r0 = rng(28)
      for (let i = 0; i < 9; i++) {
        const y = Math.floor(r0() * SIZE), x = Math.floor(r0() * SIZE), w = 2 + Math.floor(r0() * 3)
        for (let k = 0; k < w; k++) marks.add(`${(x + k) % SIZE},${y}`)
      }
      return paint(28, (x, y, r) =>
        marks.has(`${x},${y}`) ? (r() < 0.5 ? [52, 52, 48] : [86, 84, 76]) : pick(BIRCH, r()),
      )
    },
    birchTop: () => paint(29, ringsPixel(BIRCH, ramp([200, 184, 130], [0.86, 0.94, 1, 1.06]))),
    birchLeaves: () => paint(30, leafPixel(BIRCH_LEAVES)),
    snowLeaves: () => paint(31, (x, y, r) => (r() < 0.25 ? pick(LEAVES, r()) : pick(SNOW, r()))),
    cactusSide: () =>
      paint(25, (x, y, r) => {
        if (x === 0 || x === 15) return CACTUS[0]
        if (x % 5 === 2 && y % 4 === 1) return [222, 228, 178] // spines
        return x % 5 === 2 ? CACTUS[1] : pick(CACTUS, 0.5 + r() * 0.5)
      }),
    cactusTop: () => paint(26, (x, y, r) => ((x + y) % 4 === 0 ? CACTUS[1] : pick(CACTUS, 0.5 + r() * 0.5))),

    // Plants: drawn on transparent canvases and shown as two crossed planes
    tallGrass: () =>
      paint(32, (x, y, r) => {
        const blade = 4 + ((x * 7 + 3) % 9) // per-column blade height
        return x % 2 === 0 && 15 - y < blade ? pick(GRASS, r()) : null
      }),
    fern: () =>
      paint(33, (x, y, r) => {
        const dx = Math.abs(x - 7.5)
        const frond = y > 3 && dx < (16 - y) * 0.55 && (x + y) % 3 !== 0
        return frond ? pick(LEAVES, 0.4 + r() * 0.6) : null
      }),
    poppy: () =>
      paint(34, (x, y, r) => {
        if (y >= 9 && (x === 7 || (y === 11 && x === 8))) return y === 11 && x === 8 ? [76, 140, 48] : [56, 112, 38]
        if (y >= 4 && y <= 8 && Math.abs(x - 7.5) + Math.abs(y - 6) < 3.2) return y < 6 ? [222, 40, 32] : [176, 22, 22]
        if (y === 6 && (x === 7 || x === 8)) return [40, 20, 20]
        return null
      }),
    dandelion: () =>
      paint(35, (x, y, r) => {
        if (y >= 10 && x === 7) return [64, 124, 42]
        if (y >= 6 && y <= 9 && x >= 6 && x <= 9) return (x + y) % 3 ? [250, 214, 40] : [226, 170, 20]
        return null
      }),
    deadBush: () =>
      paint(36, (x, y, r) => {
        const branch =
          (y >= 12 && x === 7) ||
          (y >= 6 && y < 12 && (x === 7 - Math.floor((12 - y) / 2) || x === 8 + Math.floor((12 - y) / 2))) ||
          (y >= 4 && y < 8 && x === 7)
        return branch ? (r() < 0.5 ? [120, 82, 40] : [96, 64, 30]) : null
      }),
    water: () => paint(19, (x, y, r) => pick(WATER, 0.5 + 0.35 * Math.sin((x + y * 2) * 0.8) + (r() - 0.5) * 0.3)),
    ice: () => paint(27, (x, y, r) => ((x + y * 3) % 11 === 0 ? ICE[3] : pick(ICE, r() * 0.75))),
  }
}

const ui = {
  button: () => paint(20, (x, y, r) => shade([112, 112, 112], 0.96 + r() * 0.08)),
}

// Expose UI textures to CSS as custom properties (pixelated via image-rendering).
export function installCssTextures() {
  const root = document.documentElement.style
  root.setProperty('--tex-button', `url(${ui.button().toDataURL()})`)
}
