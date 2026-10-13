// World generation: pure maths with no browser drawing APIs, so it can run
// in a Web Worker and never block the page. Panorama.jsx turns the result
// into meshes.

import { rng } from './textures'
import { BIOMES, SUNSET } from './biomes'

function makeNoise(seed) {
  const hash = (x, z) => {
    let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 1442695041)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295
  }
  const smooth = (t) => t * t * (3 - 2 * t)
  const value = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z)
    const tx = smooth(x - xi), tz = smooth(z - zi)
    const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1)
    return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz
  }
  return (x, z) => value(x, z) * 0.6 + value(x * 2.1, z * 2.1) * 0.28 + value(x * 4.3, z * 4.3) * 0.12
}

// Deterministic 0–1 value per block position (for ore placement)
function hash3(x, y, z) {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// ---------- Blocks ----------

// Texture per face, in order +x, -x, +y, -y, +z, -z
const all = (t) => [t, t, t, t, t, t]
const sides = (side, top, bottom = top) => [side, side, top, bottom, side, side]
const BLOCK_FACES = {
  grass: sides('grassSide', 'grassTop', 'dirt'),
  snowGrass: sides('snowSide', 'snow', 'dirt'),
  dirt: all('dirt'),
  stone: all('stone'),
  coalOre: all('coalOre'),
  ironOre: all('ironOre'),
  gravel: all('gravel'),
  clay: all('clay'),
  sand: all('sand'),
  sandstone: all('sandstone'),
  snow: all('snow'),
  cobble: all('cobble'),
  mossyCobble: all('mossyCobble'),
  pumpkin: sides('pumpkinSide', 'pumpkinTop'),
  log: sides('logSide', 'logTop'),
  birchLog: sides('birchSide', 'birchTop'),
  darkOakLog: sides('darkOakSide', 'darkOakTop'),
  darkOakLeaves: all('darkOakLeaves'),
  mushroomStem: all('mushroomStem'),
  mushroomCap: sides('mushroomCap', 'mushroomCap', 'mushroomPores'),
  leaves: all('leaves'),
  birchLeaves: all('birchLeaves'),
  snowLeaves: sides('leaves', 'snowLeaves', 'leaves'),
  cactus: sides('cactusSide', 'cactusTop'),
}
const INSET = { cactus: 1 / 16 } // cactus sides sit one pixel in from the block edge
// Blocks you can see past, so they don't hide the faces next to them
const SEE_THROUGH = new Set(['cactus', 'leaves', 'birchLeaves', 'snowLeaves'])
// Flat sprites drawn as two crossed planes (or lying flat, for lily pads)
export const PLANTS = new Set([
  'tallGrass', 'fern', 'poppy', 'dandelion', 'deadBush', 'redMushroom', 'brownMushroom', 'berryBush', 'sugarCane', 'lilyPad',
  'oxeyeDaisy', 'pinkTulip',
])
// Textures with holes in them (drawn with an alpha cutout)
export const CUTOUT = new Set(['leaves', 'birchLeaves', ...PLANTS])

const FACES = [
  { n: [1, 0, 0], u: 2, v: 1, shade: 0.6 },
  { n: [-1, 0, 0], u: 2, v: 1, shade: 0.6 },
  { n: [0, 1, 0], u: 0, v: 2, shade: 1 },
  { n: [0, -1, 0], u: 0, v: 2, shade: 0.5 },
  { n: [0, 0, 1], u: 0, v: 1, shade: 0.8 },
  { n: [0, 0, -1], u: 0, v: 1, shade: 0.8 },
]
const AO = [0.5, 0.66, 0.82, 1] // corner brightness by number of open neighbours

// Precomputed per face: its 4 corners (wound to face outward), each corner's
// texture coords, and the 3 neighbouring blocks that darken that corner
const FACE_DATA = FACES.map(({ n, u, v }) => {
  const axis = n[0] ? 0 : n[1] ? 1 : 2
  let corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, j]) => {
    const p = [0, 0, 0]
    p[axis] = n[axis] > 0 ? 1 : 0
    p[u] += i
    p[v] += j
    const side1 = [...n], side2 = [...n], corner = [...n]
    side1[u] += i ? 1 : -1
    side2[v] += j ? 1 : -1
    corner[u] += i ? 1 : -1
    corner[v] += j ? 1 : -1
    return { p, uv: [i, j], around: [side1, side2, corner] }
  })
  const [a, b, , d] = corners.map((c) => c.p)
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]
  const cross = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
  if (cross[0] * n[0] + cross[1] * n[1] + cross[2] * n[2] < 0) corners = [0, 3, 2, 1].map((k) => corners[k])
  return { axis, corners }
})

const key = (x, y, z) => ((x + 128) * 256 + (z + 128)) * 256 + y

// ---------- Trees ----------

function placeTrees(set, setIfEmpty) {
  const canopy = (cx, y, cz, rad, kind, r, roundTop) => {
    for (let dx = -rad; dx <= rad; dx++) {
      for (let dz = -rad; dz <= rad; dz++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad && (roundTop || r() < 0.5)) continue
        setIfEmpty(cx + dx, y, cz + dz, kind)
      }
    }
  }
  const broadleaf = (log, leaves) => (x, top, z, r) => {
    const trunk = 4 + Math.floor(r() * 2) + (log === 'birchLog' ? 1 : 0)
    for (let y = 1; y <= trunk; y++) set(x, top + y, z, log)
    canopy(x, top + trunk - 2, z, 2, leaves, r, false)
    canopy(x, top + trunk - 1, z, 2, leaves, r, false)
    canopy(x, top + trunk, z, 1, leaves, r, false)
    canopy(x, top + trunk + 1, z, 1, leaves, r, true)
  }
  return {
    oak: broadleaf('log', 'leaves'),
    birch: broadleaf('birchLog', 'birchLeaves'),
    spruce(x, top, z, r) {
      const trunk = 6 + Math.floor(r() * 3)
      for (let y = 1; y <= trunk; y++) set(x, top + y, z, 'log')
      setIfEmpty(x, top + trunk + 1, z, 'leaves')
      for (let dy = trunk; dy >= 3; dy--) {
        // narrow at the top, alternating wider/narrower rings below
        const rad = trunk - dy < 2 ? 1 : 1 + ((trunk - dy) % 2)
        canopy(x, top + dy, z, rad, 'leaves', r, true)
      }
    },
    acacia(x, top, z, r) {
      const [ddx, ddz] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)]
      for (let y = 1; y <= 3; y++) set(x, top + y, z, 'log')
      set(x + ddx, top + 4, z + ddz, 'log')
      set(x + 2 * ddx, top + 5, z + 2 * ddz, 'log')
      // a short second branch the other way, like the real thing
      set(x - ddx, top + 4, z - ddz, 'log')
      const cx = x + 2 * ddx, cz = z + 2 * ddz
      canopy(cx, top + 6, cz, 2, 'leaves', r, true)
      canopy(cx, top + 7, cz, 1, 'leaves', r, true)
      canopy(x - ddx, top + 5, z - ddz, 1, 'leaves', r, true)
    },
    // 2×2 trunk under a broad, flat canopy
    darkOak(x, top, z, r) {
      const trunk = 5 + Math.floor(r() * 3)
      for (let y = 1; y <= trunk; y++) {
        for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) set(x + dx, top + y, z + dz, 'darkOakLog')
      }
      const layer = (y, from, to, trim) => {
        for (let dx = from; dx <= to; dx++) {
          for (let dz = from; dz <= to; dz++) {
            const edgeX = dx === from || dx === to, edgeZ = dz === from || dz === to
            if (edgeX && edgeZ && (trim || r() < 0.6)) continue
            setIfEmpty(x + dx, top + y, z + dz, 'darkOakLeaves')
          }
        }
      }
      layer(trunk - 1, -2, 3, false)
      layer(trunk, -2, 3, true)
      layer(trunk + 1, -1, 2, true)
    },
    // Giant red mushroom: pale stem under a domed, spotted cap
    hugeMushroom(x, top, z, r) {
      const stem = 4 + Math.floor(r() * 2)
      for (let y = 1; y <= stem; y++) set(x, top + y, z, 'mushroomStem')
      for (let dy = stem - 2; dy <= stem; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue
            if (Math.abs(dx) < 2 && Math.abs(dz) < 2) continue // hollow under the dome
            setIfEmpty(x + dx, top + dy, z + dz, 'mushroomCap')
          }
        }
      }
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) setIfEmpty(x + dx, top + stem + 1, z + dz, 'mushroomCap')
    },
    cactus(x, top, z, r) {
      const tall = 1 + Math.floor(r() * 3)
      for (let y = 1; y <= tall; y++) set(x, top + y, z, 'cactus')
    },
  }
}

const TREE_GROUND = {
  oak: ['grass'], birch: ['grass'], acacia: ['grass'], darkOak: ['grass'], hugeMushroom: ['grass'],
  spruce: ['grass', 'snowGrass'], cactus: ['sand'],
}

function pickWeighted(kinds, r) {
  let roll = r()
  for (const [kind, share] of Object.entries(kinds)) {
    if ((roll -= share) <= 0) return kind
  }
  return Object.keys(kinds)[0]
}

// ---------- Animals ----------
// Boxes in pixels (1/16 block), feet at y=0, facing +z. faces: per-face textures.

const leg = (x, z, h, tex) => ({ min: [x, 0, z], max: [x + 4, h, z + 4], faces: all(tex) })
const head = (min, max, skin, face, top = skin) => ({ min, max, faces: [skin, skin, top, skin, face, skin] })
const MOBS = {
  pig: [
    { min: [-5, 6, -8], max: [5, 14, 8], faces: all('pigSkin') },
    leg(-5, -8, 6, 'pigSkin'), leg(1, -8, 6, 'pigSkin'), leg(-5, 4, 6, 'pigSkin'), leg(1, 4, 6, 'pigSkin'),
    head([-4, 8, 8], [4, 16, 15], 'pigSkin', 'pigFace'),
  ],
  cow: [
    { min: [-6, 12, -9], max: [6, 22, 9], faces: all('cowHide') },
    leg(-6, -9, 12, 'cowHide'), leg(2, -9, 12, 'cowHide'), leg(-6, 5, 12, 'cowHide'), leg(2, 5, 12, 'cowHide'),
    head([-4, 15, 9], [4, 23, 15], 'cowHide', 'cowFace'),
    { min: [-6, 21, 11], max: [-4, 24, 12], faces: all('sheepFace') }, // horns
    { min: [4, 21, 11], max: [6, 24, 12], faces: all('sheepFace') },
  ],
  sheep: [
    { min: [-5, 10, -8], max: [5, 20, 8], faces: all('wool') },
    leg(-5, -8, 10, 'wool'), leg(1, -8, 10, 'wool'), leg(-5, 4, 10, 'wool'), leg(1, 4, 10, 'wool'),
    head([-3, 14, 7], [3, 21, 13], 'sheepFace', 'sheepFace', 'wool'),
  ],
}

// ---------- Clouds ----------
// Like the game: one flat layer of chunky 12×12-block cells, 4 blocks thick

const CLOUD_CELL = 12
const CLOUD_GRID = 32
export const CLOUD_SPAN = CLOUD_CELL * CLOUD_GRID

function cloudGeometry(cover, seed) {
  // Smooth, tiling pattern so the layer can wrap around seamlessly as it drifts
  const r = rng(seed)
  const coarse = 8
  const grid = Array.from({ length: coarse * coarse }, r)
  const at = (gx, gz) => grid[((gz + coarse) % coarse) * coarse + ((gx + coarse) % coarse)]
  const val = []
  for (let i = 0; i < CLOUD_GRID; i++) {
    for (let j = 0; j < CLOUD_GRID; j++) {
      const fx = (i / CLOUD_GRID) * coarse, fz = (j / CLOUD_GRID) * coarse
      const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0
      const smooth = (at(x0, z0) * (1 - tx) + at(x0 + 1, z0) * tx) * (1 - tz) + (at(x0, z0 + 1) * (1 - tx) + at(x0 + 1, z0 + 1) * tx) * tz
      val.push(smooth * 0.75 + r() * 0.25)
    }
  }
  const threshold = [...val].sort((a, b) => a - b)[Math.floor((1 - cover) * val.length)]
  const on = (i, j) => val[((i + CLOUD_GRID) % CLOUD_GRID) * CLOUD_GRID + ((j + CLOUD_GRID) % CLOUD_GRID)] >= threshold

  const pos = [], col = [], idx = []
  const size = [CLOUD_CELL, 4, CLOUD_CELL]
  const shade = [0.86, 0.86, 1, 0.72, 0.92, 0.92]
  for (let i = 0; i < CLOUD_GRID; i++) {
    for (let j = 0; j < CLOUD_GRID; j++) {
      if (!on(i, j)) continue
      const ox = i * CLOUD_CELL - CLOUD_SPAN / 2, oz = j * CLOUD_CELL - CLOUD_SPAN / 2
      for (let f = 0; f < 6; f++) {
        const [nx, , nz] = FACES[f].n
        if ((nx || nz) && on(i + nx, j + nz)) continue // hide walls between neighbouring cells
        const start = pos.length / 3
        for (const { p } of FACE_DATA[f].corners) {
          pos.push(ox + p[0] * size[0], p[1] * size[1], oz + p[2] * size[2])
          col.push(shade[f], shade[f], shade[f])
        }
        idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
      }
    }
  }
  return { pos: new Float32Array(pos), col: new Float32Array(col), idx: new Uint32Array(idx) }
}

// ---------- World ----------

export function generateWorld(biomeId, time) {
  const biome = BIOMES[biomeId]
  const noise = makeNoise(7)
  const ridgeNoise = makeNoise(13)
  const patchNoise = makeNoise(21)
  const { sea } = biome
  const sunset = time === 'sunset'
  const ridge = (x, z) => Math.max(0, 1 - Math.abs(ridgeNoise(x * 0.08, z * 0.08) - 0.5) / 0.22)
  const heightAt = (x, z) => Math.round(biome.height(noise(x * 0.045 + 40, z * 0.045 + 40), ridge(x, z), x, z))
  const HALF = biome.half ?? 56
  const SIZE = HALF * 2

  const heights = new Int16Array(SIZE * SIZE)
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) heights[(x + HALF) * SIZE + z + HALF] = heightAt(x, z)
  }
  const inside = (x, z) => x >= -HALF && x < HALF && z >= -HALF && z < HALF
  const h = (x, z) => (inside(x, z) ? heights[(x + HALF) * SIZE + z + HALF] : heightAt(x, z))
  const ground = (x, z) => biome.surface(h(x, z), 0, { sea })
  const dist = (x, z) => Math.hypot(x - 0.5, z - 0.5)

  // Terrain block at a depth below the surface, with lake beds, gravel and ores mixed in
  const terrainBlock = (x, y, z, top) => {
    const depth = top - y
    const base = biome.surface(top, depth, { sea })
    if (depth === 0) {
      const patch = patchNoise(x * 0.15, z * 0.15)
      if (top < sea) return patch > 0.6 ? 'gravel' : patch < 0.38 ? 'clay' : base
      if (base === 'stone' && biome.gravelPeaks && patch > 0.6) return 'gravel'
    }
    if (base === 'stone' && depth > 0) {
      const ore = hash3(x, y, z)
      if (ore < 0.035) return 'coalOre'
      if (ore < 0.05) return 'ironOre'
    }
    return base
  }

  // Trees and other placed blocks live in a sparse map; terrain is implicit in the heightmap
  const extra = new Map()
  const set = (x, y, z, kind) => extra.set(key(x, y, z), kind)
  const setIfEmpty = (x, y, z, kind) => {
    if (!extra.has(key(x, y, z)) && y > h(x, z)) set(x, y, z, kind)
  }
  const trees = placeTrees(set, setIfEmpty)
  const r = rng(99)
  const { kinds, chance, maxTop = Infinity, minAboveSea = 2, minDist = 4 } = biome.trees
  for (let x = -HALF + 3; x < HALF - 3; x++) {
    for (let z = -HALF + 3; z < HALF - 3; z++) {
      const top = h(x, z)
      if (top < sea + minAboveSea || top > maxTop || dist(x, z) < minDist || r() > chance) continue
      const kind = pickWeighted(kinds, r)
      if (TREE_GROUND[kind].includes(ground(x, z))) trees[kind](x, top, z, r)
    }
  }
  if (biome.snowyLeaves) {
    for (const [k, kind] of extra) {
      const above = extra.get(k + 1)
      if (kind === 'leaves' && above !== 'leaves' && above !== 'log') extra.set(k, 'snowLeaves')
    }
  }

  // Pumpkin patches and small boulders
  const { pumpkin = 0, boulder = 0, boulderBlock = 'cobble' } = biome.features ?? {}
  const fr = rng(77)
  for (let x = -HALF + 2; x < HALF - 2; x++) {
    for (let z = -HALF + 2; z < HALF - 2; z++) {
      const top = h(x, z)
      if (top <= sea + 1 || dist(x, z) < 5 || extra.has(key(x, top + 1, z))) continue
      const roll = fr()
      if (roll < pumpkin && ground(x, z) === 'grass') {
        for (let i = 0; i < 4; i++) {
          const px = x + Math.floor(fr() * 3) - 1, pz = z + Math.floor(fr() * 3) - 1
          if (h(px, pz) === top && ground(px, pz) === 'grass') setIfEmpty(px, top + 1, pz, 'pumpkin')
        }
      } else if (roll < pumpkin + boulder) {
        for (const [dx, dy, dz] of [[0, 1, 0], [1, 1, 0], [0, 1, 1], [1, 1, 1], [0, 2, 0], [-1, 1, 0]]) {
          if (dy === 2 || fr() < 0.85) setIfEmpty(x + dx, h(x + dx, z + dz) + dy, z + dz, boulderBlock)
        }
      }
    }
  }

  const blockAt = (x, y, z) => {
    const top = h(x, z)
    if (y <= top) return terrainBlock(x, y, z, top)
    return extra.get(key(x, y, z))
  }
  // Hides the face next to it
  const solid = (x, y, z) => {
    if (y <= h(x, z)) return true
    const kind = extra.get(key(x, y, z))
    return kind !== undefined && !SEE_THROUGH.has(kind)
  }
  // Darkens nearby corners (leaves count, like in the game; thin cactus doesn't)
  const occludes = (x, y, z) => {
    if (y <= h(x, z)) return true
    const kind = extra.get(key(x, y, z))
    return kind !== undefined && kind !== 'cactus'
  }

  // Mesh visible faces, grouped by texture
  const light = (biome.light ?? 1) * (sunset ? SUNSET.light : 1)
  const buffers = {}
  const buffer = (tex) => (buffers[tex] ??= { pos: [], uv: [], col: [], idx: [] })
  const toLinear = (v) => Math.min(1, v) ** 2.2

  // Brightness for each face direction × corner occlusion level
  const shadeLUT = FACES.map((face) => AO.map((ao) => toLinear(face.shade * ao * light)))

  const addFace = (x, y, z, kind, f) => {
    const { axis, corners } = FACE_DATA[f]
    const b = buffer(BLOCK_FACES[kind][f])
    const start = b.pos.length / 3
    const inset = axis === 1 ? 0 : INSET[kind] ?? 0
    let ao0, ao1, ao2, ao3
    for (let k = 0; k < 4; k++) {
      const { p, uv, around } = corners[k]
      const [s1, s2, c] = around
      const pos = [x - 0.5 + p[0], y - 0.5 + p[1], z - 0.5 + p[2]]
      if (inset) pos[axis] += p[axis] ? -inset : inset
      b.pos.push(pos[0], pos[1], pos[2])
      b.uv.push(uv[0], uv[1])
      // Ambient occlusion from the three blocks touching this corner, outside the face
      const e1 = occludes(x + s1[0], y + s1[1], z + s1[2])
      const e2 = occludes(x + s2[0], y + s2[1], z + s2[2])
      const ec = occludes(x + c[0], y + c[1], z + c[2])
      const ao = e1 && e2 ? 0 : 3 - (e1 + e2 + ec)
      if (k === 0) ao0 = ao; else if (k === 1) ao1 = ao; else if (k === 2) ao2 = ao; else ao3 = ao
      const v = shadeLUT[f][ao]
      b.col.push(v, v, v)
    }
    // Flip the quad's diagonal where needed so the corner shading blends smoothly
    if (ao0 + ao2 < ao1 + ao3) b.idx.push(start + 1, start + 2, start + 3, start + 1, start + 3, start)
    else b.idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }

  const meshBlock = (x, y, z, kind) => {
    for (let f = 0; f < 6; f++) {
      const [nx, ny, nz] = FACES[f].n
      if (f === 3 && y <= h(x, z)) continue // terrain bottoms are never visible
      if (!solid(x + nx, y + ny, z + nz) || INSET[kind]) addFace(x, y, z, kind, f)
    }
  }

  // Terrain: only the top few blocks of each column can ever show a face.
  // The square's corners lie beyond the fog, so only a circle is built.
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      if (dist(x, z) > HALF) continue
      const top = h(x, z)
      const low = Math.min(top, h(x + 1, z), h(x - 1, z), h(x, z + 1), h(x, z - 1))
      for (let y = top; y > low || y === top; y--) meshBlock(x, y, z, blockAt(x, y, z))
    }
  }
  for (const [k, kind] of extra) {
    const y = k % 256, xz = Math.floor(k / 256)
    const x = Math.floor(xz / 256) - 128, z = (xz % 256) - 128
    if (dist(x, z) <= HALF) meshBlock(x, y, z, kind)
  }

  // Plants: two crossed planes standing on the ground
  const plantShade = toLinear(0.9 * light)
  const quad = (b, corners) => {
    const start = b.pos.length / 3
    b.pos.push(...corners)
    b.uv.push(0, 0, 1, 0, 1, 1, 0, 1)
    for (let i = 0; i < 4; i++) b.col.push(plantShade, plantShade, plantShade)
    b.idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }
  const cross = (kind, x, y, z, ox, oz) => {
    const s = 0.45
    for (const [dx, dz] of [[1, 1], [1, -1]]) {
      quad(buffer(kind), [
        x + ox - dx * s, y - 0.5, z + oz - dz * s,
        x + ox + dx * s, y - 0.5, z + oz + dz * s,
        x + ox + dx * s, y + 0.5, z + oz + dz * s,
        x + ox - dx * s, y + 0.5, z + oz - dz * s,
      ])
    }
  }
  const pr = rng(123)
  const { sugarCane = 0, lilyPad = 0 } = biome.water === 'ice' ? {} : biome.shore ?? {}
  const nearWater = (x, z) => h(x + 1, z) < sea || h(x - 1, z) < sea || h(x, z + 1) < sea || h(x, z - 1) < sea
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      if (dist(x, z) > HALF) continue
      const top = h(x, z)
      // Lily pads float on shallow water
      if (top < sea) {
        if (sea - top <= 3 && pr() < lilyPad) {
          const y = sea + 0.42, s = 0.5
          quad(buffer('lilyPad'), [x - s, y, z - s, x + s, y, z - s, x + s, y, z + s, x - s, y, z + s])
        }
        continue
      }
      if (extra.has(key(x, top + 1, z))) continue
      // Sugar cane grows right at the water's edge
      if (top <= sea + 1 && nearWater(x, z) && pr() < sugarCane) {
        const tall = 1 + Math.floor(pr() * 3)
        for (let i = 1; i <= tall; i++) cross('sugarCane', x, top + i, z, 0, 0)
        continue
      }
      if (top <= sea) continue
      for (const [kind, odds, on] of biome.plants ?? []) {
        if (ground(x, z) !== on || pr() > odds) continue
        cross(kind, x, top + 1, z, (pr() - 0.5) * 0.3, (pr() - 0.5) * 0.3)
        break
      }
    }
  }

  // Animals grazing within sight of the camera, on flat grass
  const { kinds: mobKinds, count = 0 } = biome.animals ?? {}
  const ar = rng(31)
  const placed = []
  for (let tries = 0; tries < 400 && placed.length < count; tries++) {
    const angle = ar() * Math.PI * 2, d = 7 + ar() * 16
    const x = Math.round(Math.cos(angle) * d), z = Math.round(Math.sin(angle) * d)
    const top = h(x, z)
    if (top <= sea + 1 || !['grass', 'snowGrass'].includes(ground(x, z))) continue
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => h(x + dx, z + dz) !== top || extra.has(key(x + dx, top + 1, z + dz)))) continue
    if (extra.has(key(x, top + 1, z)) || placed.some(([px, pz]) => Math.hypot(px - x, pz - z) < 3)) continue
    placed.push([x, z])
    const turn = Math.floor(ar() * 4)
    const rot = ([lx, lz]) => [[lx, lz], [lz, -lx], [-lx, -lz], [-lz, lx]][turn]
    for (const part of MOBS[pickWeighted(mobKinds, ar)]) {
      for (let f = 0; f < 6; f++) {
        const [wnx, wnz] = rot([FACES[f].n[0], FACES[f].n[2]])
        const shadeFace = FACES.find((F) => F.n[0] === wnx && F.n[1] === FACES[f].n[1] && F.n[2] === wnz)
        const v = toLinear(shadeFace.shade * light)
        const b = buffer(part.faces[f])
        const start = b.pos.length / 3
        for (const { p, uv } of FACE_DATA[f].corners) {
          const local = [0, 1, 2].map((a) => (part.min[a] + p[a] * (part.max[a] - part.min[a])) / 16)
          const [wx, wz] = rot([local[0], local[2]])
          b.pos.push(x + wx, top + 0.5 + local[1], z + wz)
          b.uv.push(uv[0], uv[1])
          b.col.push(v, v, v)
        }
        b.idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
      }
    }
  }

  // Eye level just above the nearby ground, like a player looking out from a hill
  let peak = sea
  for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) peak = Math.max(peak, h(x, z))
  const eyeY = peak + (biome.eyeLift ?? 5)


  // Hand back compact typed arrays (they can move between threads without copying)
  const out = {}
  for (const [tex, b] of Object.entries(buffers)) {
    out[tex] = {
      pos: new Float32Array(b.pos),
      uv: new Float32Array(b.uv),
      col: new Float32Array(b.col),
      idx: new Uint32Array(b.idx),
    }
  }
  return {
    buffers: out,
    eyeY,
    half: HALF,
    waterShade: toLinear(0.95 * light),
    cloud: cloudGeometry(biome.cloudCover ?? 0.35, 5),
    cloudY: biome.cloudHeight ?? Math.max(eyeY + 24, 54),
  }
}

// Everything that should move between threads without copying
export const transferables = (world) => [
  ...Object.values(world.buffers).flatMap((b) => [b.pos.buffer, b.uv.buffer, b.col.buffer, b.idx.buffer]),
  world.cloud.pos.buffer,
  world.cloud.col.buffer,
  world.cloud.idx.buffer,
]
