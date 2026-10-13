import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { worldTextures, rng } from '../lib/textures'
import { BIOMES, pickBiome } from '../lib/biomes'
import { useSettings } from '../lib/settings'

// A procedurally generated voxel world, viewed from a hilltop by a slowly
// turning camera — the same idea as a game's rotating menu panorama.
//
// Instead of drawing every block as a cube, only faces that touch air are
// meshed, and each corner is darkened by the blocks around it (ambient
// occlusion) with fixed per-face brightness — the classic blocky-game look,
// with no real-time lights needed.

const SIZE = 112
const HALF = SIZE / 2
const TURN_SPEED = (Math.PI * 2) / 160 // one full turn every ~160s
const FRAME_MS = 1000 / 30 // cap at 30fps: plenty for a slow pan, kinder to batteries

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

// Crisp up close (nearest), and blended down with mipmaps in the distance so
// far-off blocks don't turn into shimmering static
function texture(canvas, anisotropy = 1) {
  const t = new THREE.CanvasTexture(canvas)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestMipmapLinearFilter
  t.anisotropy = anisotropy
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Render scale: low when blurred (no one can tell), full sharpness otherwise
const pixelRatio = (blur) => (blur ? Math.min(window.devicePixelRatio, 1) * 0.6 : Math.min(window.devicePixelRatio, 1.5))

// ---------- Blocks ----------

// Texture per face, in order +x, -x, +y, -y, +z, -z
const all = (t) => [t, t, t, t, t, t]
const sides = (side, top, bottom = top) => [side, side, top, bottom, side, side]
const BLOCK_FACES = {
  grass: sides('grassSide', 'grassTop', 'dirt'),
  snowGrass: sides('snowSide', 'snow', 'dirt'),
  dirt: all('dirt'),
  stone: all('stone'),
  sand: all('sand'),
  sandstone: all('sandstone'),
  snow: all('snow'),
  log: sides('logSide', 'logTop'),
  birchLog: sides('birchSide', 'birchTop'),
  leaves: all('leaves'),
  birchLeaves: all('birchLeaves'),
  snowLeaves: sides('leaves', 'snowLeaves', 'leaves'),
  cactus: sides('cactusSide', 'cactusTop'),
}
const INSET = { cactus: 1 / 16 } // cactus sides sit one pixel in from the block edge
// Blocks you can see past, so they don't hide the faces next to them
const SEE_THROUGH = new Set(['cactus', 'leaves', 'birchLeaves', 'snowLeaves'])
// Textures with holes in them (drawn with an alpha cutout)
const CUTOUT = new Set(['leaves', 'birchLeaves', 'tallGrass', 'fern', 'poppy', 'dandelion', 'deadBush'])
const PLANTS = new Set(['tallGrass', 'fern', 'poppy', 'dandelion', 'deadBush'])

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
    cactus(x, top, z, r) {
      const tall = 1 + Math.floor(r() * 3)
      for (let y = 1; y <= tall; y++) set(x, top + y, z, 'cactus')
    },
  }
}

const TREE_GROUND = { oak: ['grass'], birch: ['grass'], acacia: ['grass'], spruce: ['grass', 'snowGrass'], cactus: ['sand'] }

function pickWeighted(kinds, r) {
  let roll = r()
  for (const [kind, share] of Object.entries(kinds)) {
    if ((roll -= share) <= 0) return kind
  }
  return Object.keys(kinds)[0]
}

// ---------- World ----------

function buildWorld(scene, disposables, biome, anisotropy) {
  const noise = makeNoise(7)
  const ridgeNoise = makeNoise(13)
  const { sea } = biome
  const ridge = (x, z) => Math.max(0, 1 - Math.abs(ridgeNoise(x * 0.08, z * 0.08) - 0.5) / 0.22)
  const heightAt = (x, z) => Math.round(biome.height(noise(x * 0.045 + 40, z * 0.045 + 40), ridge(x, z)))

  const heights = new Int16Array(SIZE * SIZE)
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) heights[(x + HALF) * SIZE + z + HALF] = heightAt(x, z)
  }
  const inside = (x, z) => x >= -HALF && x < HALF && z >= -HALF && z < HALF
  const h = (x, z) => (inside(x, z) ? heights[(x + HALF) * SIZE + z + HALF] : heightAt(x, z))
  const ground = (x, z) => biome.surface(h(x, z), 0, { sea })

  // Trees and other placed blocks live in a sparse map; terrain is implicit in the heightmap
  const extra = new Map()
  const set = (x, y, z, kind) => extra.set(key(x, y, z), kind)
  const setIfEmpty = (x, y, z, kind) => {
    if (!extra.has(key(x, y, z)) && y > h(x, z)) set(x, y, z, kind)
  }
  const trees = placeTrees(set, setIfEmpty)
  const r = rng(99)
  const { kinds, chance, maxTop = Infinity, minAboveSea = 2 } = biome.trees
  for (let x = -HALF + 3; x < HALF - 3; x++) {
    for (let z = -HALF + 3; z < HALF - 3; z++) {
      const top = h(x, z)
      if (top < sea + minAboveSea || top > maxTop || Math.abs(x) + Math.abs(z) < 5 || r() > chance) continue
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

  const blockAt = (x, y, z) => {
    const top = h(x, z)
    if (y <= top) return biome.surface(top, top - y, { sea })
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
  const light = biome.light ?? 1
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

  // Terrain: only the top few blocks of each column can ever show a face
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      const top = h(x, z)
      const low = Math.min(top, h(x + 1, z), h(x - 1, z), h(x, z + 1), h(x, z - 1))
      for (let y = top; y > low || y === top; y--) meshBlock(x, y, z, blockAt(x, y, z))
    }
  }
  for (const [k, kind] of extra) {
    const y = k % 256, xz = Math.floor(k / 256)
    meshBlock(Math.floor(xz / 256) - 128, y, (xz % 256) - 128, kind)
  }

  // Plants: two crossed planes standing on the ground
  const pr = rng(123)
  const plantShade = toLinear(0.9 * light)
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      const top = h(x, z)
      if (top <= sea || extra.has(key(x, top + 1, z))) continue
      for (const [kind, odds, on] of biome.plants ?? []) {
        if (ground(x, z) !== on || pr() > odds) continue
        const b = buffer(kind)
        const ox = (pr() - 0.5) * 0.3, oz = (pr() - 0.5) * 0.3
        const s = 0.45
        for (const [dx, dz] of [[1, 1], [1, -1]]) {
          const start = b.pos.length / 3
          b.pos.push(
            x + ox - dx * s, top + 0.5, z + oz - dz * s,
            x + ox + dx * s, top + 0.5, z + oz + dz * s,
            x + ox + dx * s, top + 1.5, z + oz + dz * s,
            x + ox - dx * s, top + 1.5, z + oz - dz * s,
          )
          b.uv.push(0, 0, 1, 0, 1, 1, 0, 1)
          for (let i = 0; i < 4; i++) b.col.push(plantShade, plantShade, plantShade)
          b.idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
        }
        break
      }
    }
  }

  // Turn buffers into meshes, one per texture
  const sources = worldTextures(biome.palette)
  for (const [tex, b] of Object.entries(buffers)) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3))
    geo.setIndex(b.idx)
    const map = texture(sources[tex](), anisotropy)
    const material = new THREE.MeshBasicMaterial({
      map,
      vertexColors: true,
      ...(CUTOUT.has(tex) && { alphaTest: 0.5 }),
      ...(PLANTS.has(tex) && { side: THREE.DoubleSide }),
    })
    scene.add(new THREE.Mesh(geo, material))
    disposables.push(geo, map, material)
  }

  // Water (or ice) as one flat sheet at sea level
  const waterTex = texture(sources[biome.water](), anisotropy)
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping
  waterTex.repeat.set(SIZE, SIZE)
  const frozen = biome.water === 'ice'
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshBasicMaterial({
      map: waterTex,
      color: new THREE.Color().setScalar(toLinear(0.95 * light)),
      transparent: !frozen,
      opacity: frozen ? 1 : 0.8,
    }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(-0.5, sea + (frozen ? 0.5 : 0.4), -0.5)
  scene.add(water)

  // Stand above the tallest ground nearby so the view opens over the landscape
  let peak = sea
  for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) peak = Math.max(peak, h(x, z))
  const eyeY = Math.max(peak + 8, biome.minEye ?? 0)

  // Flat, blocky clouds that drift overhead
  const box = new THREE.BoxGeometry(1, 1, 1)
  const clouds = new THREE.Group()
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false })
  for (let i = 0; i < biome.clouds; i++) {
    const c = new THREE.Mesh(box, cloudMat)
    c.scale.set(8 + r() * 16, 2, 6 + r() * 12)
    c.position.set((r() - 0.5) * 220, Math.max(eyeY + 22, 52) + r() * 3, (r() - 0.5) * 220)
    clouds.add(c)
  }
  scene.add(clouds)

  // A square sun, in view when the page opens; the turning camera then sweeps past it
  const sunGeo = new THREE.PlaneGeometry(16, 16)
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false })
  const sun = new THREE.Mesh(sunGeo, sunMat)
  sun.position.set(35, eyeY + 38, -120)
  sun.lookAt(0.5, eyeY, 0.5)
  scene.add(sun)

  disposables.push(box, water.geometry, water.material, waterTex, cloudMat, sunGeo, sunMat)
  return { eyeY, clouds }
}

function skyTexture([top, mid, horizon]) {
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 256
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, top)
  grad.addColorStop(0.55, mid)
  grad.addColorStop(1, horizon)
  g.fillStyle = grad
  g.fillRect(0, 0, 2, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Panorama() {
  const canvasRef = useRef(null)
  const { motion, blur, biome: biomeSetting } = useSettings()
  const motionRef = useRef(motion)
  motionRef.current = motion
  const blurRef = useRef(blur)
  blurRef.current = blur
  const rendererRef = useRef(null)
  const resizeRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' })
    } catch {
      return // No WebGL: the CSS sky gradient behind the canvas still shows
    }
    renderer.setPixelRatio(pixelRatio(blurRef.current))
    rendererRef.current = renderer

    const biome = BIOMES[pickBiome(biomeSetting)]
    const disposables = []
    const scene = new THREE.Scene()
    const sky = skyTexture(biome.sky)
    disposables.push(sky)
    scene.background = sky
    scene.fog = new THREE.Fog(...biome.fog)

    const { eyeY, clouds } = buildWorld(scene, disposables, biome, renderer.capabilities.getMaxAnisotropy())
    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200)
    camera.rotation.order = 'YXZ'
    camera.position.set(0.5, eyeY, 0.5)
    camera.rotation.x = -0.26

    const resize = () => {
      // Hidden or minimized windows can report 0×0; never let the camera's aspect go invalid
      const w = Math.max(1, window.innerWidth), hgt = Math.max(1, window.innerHeight)
      renderer.setSize(w, hgt, false)
      camera.aspect = w / hgt
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    resize()
    resizeRef.current = resize
    window.addEventListener('resize', resize)

    let raf, last = performance.now()
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      if (!motionRef.current || now - last < FRAME_MS) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      camera.rotation.y += dt * TURN_SPEED
      for (const c of clouds.children) {
        c.position.x += dt * 0.8
        if (c.position.x > 110) c.position.x -= 220
      }
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      rendererRef.current = resizeRef.current = null
    }
  }, [biomeSetting])

  // Switching blur on/off changes how sharply the world needs drawing
  useEffect(() => {
    if (!rendererRef.current) return
    rendererRef.current.setPixelRatio(pixelRatio(blur))
    resizeRef.current?.()
  }, [blur])

  return (
    <div className="panorama" aria-hidden="true">
      <canvas ref={canvasRef} className={blur ? 'blurred' : ''} />
      <div className="panorama-shade" />
    </div>
  )
}
