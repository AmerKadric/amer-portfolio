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

// Stone with a few small clusters of ore pixels
function oreTexture(seed, [dark, light]) {
  const blot = tileNoise(41, 4)
  const r0 = rng(seed)
  const ore = new Set()
  for (let i = 0; i < 4; i++) {
    const cx = 2 + Math.floor(r0() * 12), cy = 2 + Math.floor(r0() * 12)
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]]) if (r0() < 0.75) ore.add(`${cx + dx},${cy + dy}`)
  }
  return paint(seed, (x, y, r) => (ore.has(`${x},${y}`) ? (r() < 0.6 ? dark : light) : pick(STONE, blot(x, y) * 0.65 + r() * 0.35)))
}

// Cobblestone: irregular stones with dark mortar lines, optionally mossy
function cobbleTexture(seed, stones, moss) {
  const r0 = rng(seed)
  const seeds = Array.from({ length: 9 }, () => [r0() * 16, r0() * 16])
  return paint(seed, (x, y, r) => {
    // distance to nearest and second-nearest stone centre (wrapping), mortar where they're close
    let d1 = 99, d2 = 99
    for (const [sx, sy] of seeds) {
      const dx = Math.min(Math.abs(x - sx), 16 - Math.abs(x - sx)), dy = Math.min(Math.abs(y - sy), 16 - Math.abs(y - sy))
      const d = Math.hypot(dx, dy)
      if (d < d1) { d2 = d1; d1 = d } else if (d < d2) d2 = d
    }
    if (d2 - d1 < 0.9) return STONE[0]
    if (moss && r() < 0.35) return pick(moss, r())
    return pick(stones, 0.35 + r() * 0.65)
  })
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
    // Stone with ore clusters showing in cliffs
    coalOre: () => oreTexture(51, [[38, 38, 38], [58, 58, 58]]),
    ironOre: () => oreTexture(52, [[216, 175, 147], [180, 132, 104]]),
    gravel: () =>
      paint(53, (x, y, r) => {
        const t = r()
        return t < 0.2 ? [96, 90, 88] : t < 0.45 ? [128, 122, 120] : t < 0.75 ? [150, 144, 140] : t < 0.9 ? [118, 104, 92] : [176, 170, 166]
      }),
    clay: () => paint(54, (x, y, r) => pick(ramp([160, 166, 178], [0.94, 0.98, 1, 1.03]), r())),
    cobble: () => cobbleTexture(55, STONE, null),
    mossyCobble: () => cobbleTexture(56, STONE, ramp([90, 116, 58], [0.8, 0.95, 1.08])),
    pumpkinSide: () =>
      paint(57, (x, y, r) => {
        const rib = x % 4 === 0 || x === 15
        return rib ? [180, 96, 18] : pick(ramp([226, 132, 28], [0.92, 1, 1.06]), r())
      }),
    pumpkinTop: () =>
      paint(58, (x, y, r) => {
        if (x >= 7 && x <= 8 && y >= 7 && y <= 8) return [96, 70, 30] // stem
        const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))
        return Math.floor(d) % 3 === 0 ? [184, 100, 20] : pick(ramp([222, 128, 26], [0.92, 1, 1.05]), r())
      }),
    redMushroom: () =>
      paint(59, (x, y) => {
        if (y >= 10 && x >= 7 && x <= 8) return [226, 218, 196]
        if (y >= 5 && y <= 9 && Math.abs(x - 7.5) < 4.5 - (9 - y) * 0.6) return (x * 3 + y) % 5 === 0 ? [240, 236, 230] : [200, 30, 30]
        return null
      }),
    brownMushroom: () =>
      paint(60, (x, y) => {
        if (y >= 11 && x >= 7 && x <= 8) return [210, 200, 176]
        if (y >= 8 && y <= 10 && Math.abs(x - 7.5) < 4 - (10 - y) * 0.8) return [150, 110, 80]
        return null
      }),
    berryBush: () =>
      paint(61, (x, y, r) => {
        const bush = y > 4 && Math.abs(x - 7.5) < 7 - Math.abs(y - 10) * 0.4 && r() > 0.25
        if (!bush) return null
        return (x * 5 + y * 3) % 11 === 0 ? [196, 30, 52] : pick(LEAVES, 0.3 + r() * 0.7)
      }),
    sugarCane: () =>
      paint(62, (x, y, r) => {
        const stalk = x === 3 || x === 4 || x === 10 || x === 11 || ((x === 7 || x === 8) && y > 2)
        if (!stalk) return null
        return y % 5 === 0 ? [150, 186, 98] : pick(ramp([112, 168, 74], [0.85, 1, 1.1]), r())
      }),
    lilyPad: () =>
      paint(63, (x, y, r) => {
        const d = Math.hypot(x - 7.5, y - 7.5)
        if (d > 7.2 || (x > 7 && Math.abs(y - 7.5) < x - 8.5)) return null // round with a notch
        return pick(ramp([40, 110, 40], [0.8, 0.95, 1.08]), r())
      }),

    // Dark oak: deep brown bark and dense, dark leaves (opaque, like distant canopies in the game)
    darkOakSide: () => {
      const col = Array.from({ length: SIZE }, rng(71))
      const bark = ramp([66, 46, 26], [0.62, 0.78, 0.9, 1, 1.12])
      return paint(71, (x, y, r) => pick(bark, col[x] * 0.6 + r() * 0.4))
    },
    darkOakTop: () => paint(72, ringsPixel(ramp([66, 46, 26], [0.7, 0.85, 1, 1.1]), ramp([110, 84, 52], [0.86, 0.94, 1, 1.06]))),
    darkOakLeaves: () => paint(73, (x, y, r) => pick(ramp([44, 92, 30], [0.62, 0.76, 0.9, 1.04]), r())),
    // Giant mushrooms
    mushroomStem: () => paint(74, (x, y, r) => pick(ramp([224, 218, 204], [0.88, 0.95, 1]), r())),
    mushroomCap: () => {
      const spots = new Set(['3,3', '4,3', '3,4', '11,2', '12,2', '11,3', '7,8', '8,8', '7,9', '13,11', '13,12', '2,12', '3,12'])
      return paint(75, (x, y, r) => (spots.has(`${x},${y}`) ? [236, 232, 226] : pick(ramp([196, 34, 30], [0.84, 0.94, 1.04]), r())))
    },
    mushroomPores: () => paint(76, (x, y, r) => pick(ramp([214, 186, 160], [0.9, 1]), r())),
    oxeyeDaisy: () =>
      paint(77, (x, y) => {
        if (y >= 9 && x === 7) return [72, 130, 46]
        if (y >= 4 && y <= 8 && Math.abs(x - 7.5) + Math.abs(y - 6) < 3.4) return x >= 7 && x <= 8 && y >= 5 && y <= 6 ? [236, 200, 40] : [244, 244, 240]
        return null
      }),
    pinkTulip: () =>
      paint(78, (x, y) => {
        if (y >= 9 && x === 7) return [64, 124, 44]
        if (y === 10 && (x === 6 || x === 8)) return [76, 140, 50]
        if (y >= 4 && y <= 8 && x >= 6 && x <= 9) return (x === 6 || x === 9) && y === 4 ? null : y < 6 ? [246, 170, 196] : [226, 130, 166]
        return null
      }),

    // Building blocks for the hidden game
    planks: () => {
      const wood = ramp([168, 132, 80], [0.72, 0.86, 0.95, 1.04])
      return paint(80, (x, y, r) => {
        if (y % 4 === 3) return wood[0] // board seams
        if ((y % 8 < 4 ? x === 3 : x === 11) && r() < 0.9) return wood[0] // staggered board ends
        return pick(wood, 0.3 + r() * 0.7)
      })
    },
    glass: () =>
      paint(81, (x, y) => {
        const edge = x === 0 || y === 0 || x === 15 || y === 15
        if (edge) return [196, 222, 230]
        if ((x - y === 3 || x - y === 4) && x > 4 && x < 13) return [236, 246, 250] // glint
        return null // see-through
      }),
    bricks: () => {
      const brick = ramp([150, 74, 58], [0.8, 0.92, 1, 1.08])
      return paint(82, (x, y, r) => {
        const row = Math.floor(y / 4)
        const mortarH = y % 4 === 3
        const mortarV = (x + (row % 2) * 4) % 8 === 7
        return mortarH || mortarV ? [176, 168, 156] : pick(brick, r())
      })
    },

    // Zombie
    zombieSkin: () => paint(90, (x, y, r) => pick(ramp([82, 128, 66], [0.84, 0.94, 1.04]), r())),
    zombieHair: () => paint(91, (x, y, r) => pick(ramp([52, 88, 44], [0.86, 0.96, 1.04]), r())),
    zombieFace: () =>
      paint(92, (x, y, r) => {
        if (y >= 7 && y <= 8 && (x === 3 || x === 4 || x === 11 || x === 12)) return [24, 30, 22] // eyes
        if (y === 11 && x >= 6 && x <= 9) return [50, 74, 40] // mouth
        if (y < 3) return pick(ramp([52, 88, 44], [0.86, 1]), r()) // hairline
        return pick(ramp([82, 128, 66], [0.84, 0.94, 1.04]), r())
      }),
    zombieShirt: () => paint(93, (x, y, r) => pick(ramp([40, 156, 160], [0.82, 0.92, 1.02]), r())),
    zombiePants: () => paint(94, (x, y, r) => pick(ramp([70, 60, 150], [0.82, 0.92, 1.02]), r())),

    // Iron sword: blade along the diagonal, guard across it, handle bottom-left
    ironSword: () =>
      paint(95, (x, y) => {
        const d = x + y, c = x - y
        if (x === 0 && y === 15) return [64, 64, 74] // pommel
        if (d === 15 && x >= 1 && x <= 3) return [112, 80, 48] // handle
        if (c === -7 && x >= 2 && x <= 6) return [72, 72, 82] // guard
        if (x >= 5 && x <= 14 && d >= 14 && d <= 16) {
          if (x === 14 && d !== 15) return null // pointed tip
          return d === 14 ? [236, 236, 240] : d === 15 ? [196, 196, 206] : [128, 128, 140]
        }
        if (x >= 5 && x <= 13 && (d === 13 || d === 17)) return [60, 60, 70] // outline
        return null
      }),

    // Simple animal skins
    pigSkin: () => paint(64, (x, y, r) => pick(ramp([236, 160, 160], [0.94, 1, 1.03]), r())),
    pigFace: () =>
      paint(65, (x, y, r) => {
        if (y === 5 && (x === 3 || x === 12)) return [20, 20, 20] // eyes
        if (y === 4 && (x === 2 || x === 13)) return [250, 250, 250]
        if (y >= 9 && y <= 12 && x >= 5 && x <= 10) return x === 6 || x === 9 ? [140, 70, 70] : [246, 176, 176] // snout
        return pick(ramp([236, 160, 160], [0.94, 1, 1.03]), r())
      }),
    cowHide: () => {
      const spots = tileNoise(66, 4)
      return paint(66, (x, y, r) => (spots(x, y) > 0.62 ? pick(ramp([232, 230, 224], [0.95, 1]), r()) : pick(ramp([74, 50, 34], [0.88, 1, 1.08]), r())))
    },
    cowFace: () =>
      paint(67, (x, y, r) => {
        if (y === 5 && (x === 3 || x === 12)) return [20, 20, 20]
        if (y >= 10 && x >= 4 && x <= 11) return [200, 180, 170] // muzzle
        if (x >= 6 && x <= 9 && y < 10) return [232, 230, 224] // blaze
        return pick(ramp([74, 50, 34], [0.9, 1]), r())
      }),
    wool: () => paint(68, (x, y, r) => pick(ramp([236, 236, 230], [0.9, 0.96, 1]), r())),
    sheepFace: () =>
      paint(69, (x, y, r) => {
        if (y < 4) return pick(ramp([236, 236, 230], [0.92, 1]), r()) // wool fringe
        if (y === 7 && (x === 4 || x === 11)) return [30, 30, 30]
        if (y === 7 && (x === 3 || x === 12)) return [250, 250, 250]
        if (y >= 11 && x >= 6 && x <= 9) return [220, 170, 160]
        return pick(ramp([214, 186, 156], [0.94, 1]), r())
      }),
    hoof: () => paint(70, (x, y, r) => pick(ramp([70, 54, 44], [0.9, 1]), r())),

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
