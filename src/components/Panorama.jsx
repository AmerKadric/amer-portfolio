import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { worldTextures, rng } from '../lib/textures'
import { BIOMES, pickBiome } from '../lib/biomes'
import { useSettings } from '../lib/settings'

// A procedurally generated voxel world, viewed from a hilltop by a slowly
// turning camera — the same idea as a game's rotating menu panorama.

const SIZE = 112
const TURN_SPEED = (Math.PI * 2) / 160 // one full turn every ~160s

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

function texture(canvas) {
  const t = new THREE.CanvasTexture(canvas)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Tree shapes, each pushing block positions into `blocks`
const TREES = {
  oak(x, top, z, r, blocks, leaves) {
    const trunk = 4 + Math.floor(r() * 2)
    for (let y = 1; y <= trunk; y++) blocks.log.push(x, top + y, z)
    for (let dy = trunk - 2; dy <= trunk + 1; dy++) {
      const rad = dy >= trunk ? 1 : 2
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          if (dx === 0 && dz === 0 && dy <= trunk) continue
          if (Math.abs(dx) === rad && Math.abs(dz) === rad && (dy === trunk + 1 || r() < 0.5)) continue
          leaves.add(`${x + dx},${top + dy},${z + dz}`)
        }
      }
    }
  },
  spruce(x, top, z, r, blocks, leaves) {
    const trunk = 6 + Math.floor(r() * 3)
    for (let y = 1; y <= trunk; y++) blocks.log.push(x, top + y, z)
    leaves.add(`${x},${top + trunk + 1},${z}`)
    for (let dy = trunk; dy >= 3; dy--) {
      // narrow at the top, alternating wider/narrower rings below
      const rad = trunk - dy < 2 ? 1 : 1 + ((trunk - dy) % 2)
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          if (dx === 0 && dz === 0) continue
          if (Math.abs(dx) === rad && Math.abs(dz) === rad) continue
          leaves.add(`${x + dx},${top + dy},${z + dz}`)
        }
      }
    }
  },
  acacia(x, top, z, r, blocks, leaves) {
    const [ddx, ddz] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)]
    for (let y = 1; y <= 3; y++) blocks.log.push(x, top + y, z)
    blocks.log.push(x + ddx, top + 4, z + ddz, x + 2 * ddx, top + 5, z + 2 * ddz)
    const cx = x + 2 * ddx, cz = z + 2 * ddz
    for (const [dy, rad] of [[6, 2], [7, 1]]) {
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          if (Math.abs(dx) === rad && Math.abs(dz) === rad) continue
          leaves.add(`${cx + dx},${top + dy},${cz + dz}`)
        }
      }
    }
  },
  cactus(x, top, z, r, blocks) {
    const tall = 1 + Math.floor(r() * 3)
    for (let y = 1; y <= tall; y++) blocks.cactus.push(x, top + y, z)
  },
}

const TREE_GROUND = { oak: ['grass'], acacia: ['grass'], spruce: ['grass', 'snowGrass'], cactus: ['sand'] }

function buildWorld(scene, disposables, biome) {
  const noise = makeNoise(7)
  const { sea } = biome
  const heightAt = (x, z) => Math.round(biome.height(noise(x * 0.045 + 40, z * 0.045 + 40)))

  const half = SIZE / 2
  const heights = []
  for (let x = -half; x < half; x++) {
    heights[x + half] = []
    for (let z = -half; z < half; z++) heights[x + half][z + half] = heightAt(x, z)
  }
  const h = (x, z) => heights[x + half]?.[z + half] ?? heightAt(x, z)

  const blocks = {
    grass: [], snowGrass: [], dirt: [], stone: [], sand: [], sandstone: [], snow: [],
    log: [], leaves: [], cactus: [],
  }
  const r = rng(99)
  const fill = biome.fillDepth ?? 6

  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const top = h(x, z)
      const floor = Math.min(top, h(x + 1, z), h(x - 1, z), h(x, z + 1), h(x, z - 1)) - 1
      for (let y = top; y >= Math.max(floor, top - fill); y--) {
        blocks[biome.surface(top, top - y, { sea })].push(x, y, z)
      }
    }
  }

  // Trees and cacti, keeping the camera's spot clear
  const leaves = new Set()
  const { kind, chance, maxTop = Infinity, minAboveSea = 2 } = biome.trees
  for (let x = -half + 3; x < half - 3; x++) {
    for (let z = -half + 3; z < half - 3; z++) {
      const top = h(x, z)
      if (top < sea + minAboveSea || top > maxTop || Math.abs(x) + Math.abs(z) < 5 || r() > chance) continue
      if (!TREE_GROUND[kind].includes(biome.surface(top, 0, { sea }))) continue
      TREES[kind](x, top, z, r, blocks, leaves)
    }
  }
  leaves.forEach((k) => blocks.leaves.push(...k.split(',').map(Number)))

  // Only build the textures and materials this biome actually uses
  const sources = worldTextures(biome.palette)
  const mats = {}
  const mat = (name) => {
    if (!mats[name]) {
      const t = texture(sources[name]())
      mats[name] = new THREE.MeshLambertMaterial({ map: t })
      disposables.push(t, mats[name])
    }
    return mats[name]
  }
  const sides = (side, top, bottom = top) => [side, side, top, bottom, side, side] // +x -x +y -y +z -z
  const materials = {
    grass: () => sides(mat('grassSide'), mat('grassTop'), mat('dirt')),
    snowGrass: () => sides(mat('snowSide'), mat('snow'), mat('dirt')),
    log: () => sides(mat('logSide'), mat('logTop')),
    cactus: () => sides(mat('cactusSide'), mat('cactusTop')),
  }
  const SCALE = { cactus: [0.875, 1, 0.875] }

  const box = new THREE.BoxGeometry(1, 1, 1)
  const matrix = new THREE.Matrix4()
  for (const [type, pos] of Object.entries(blocks)) {
    const count = pos.length / 3
    if (!count) continue
    const mesh = new THREE.InstancedMesh(box, materials[type]?.() ?? mat(type), count)
    const [sx, sy, sz] = SCALE[type] ?? [1, 1, 1]
    for (let i = 0; i < count; i++) {
      matrix.makeScale(sx, sy, sz).setPosition(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
      mesh.setMatrixAt(i, matrix)
    }
    scene.add(mesh)
  }

  // Water (or ice) as one flat sheet at sea level
  const waterTex = texture(sources[biome.water]())
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping
  waterTex.repeat.set(SIZE, SIZE)
  const frozen = biome.water === 'ice'
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshLambertMaterial({ map: waterTex, transparent: !frozen, opacity: frozen ? 1 : 0.82 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(-0.5, sea + (frozen ? 0.5 : 0.4), -0.5)
  scene.add(water)

  // Stand above the tallest ground nearby so the view opens over the landscape
  let peak = sea
  for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) peak = Math.max(peak, h(x, z))
  const eyeY = Math.max(peak + 8, biome.minEye ?? 0)

  // Flat, blocky clouds that drift overhead
  const clouds = new THREE.Group()
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false })
  for (let i = 0; i < biome.clouds; i++) {
    const c = new THREE.Mesh(box, cloudMat)
    c.scale.set(8 + r() * 16, 2, 6 + r() * 12)
    c.position.set((r() - 0.5) * 220, Math.max(eyeY + 22, 52) + r() * 3, (r() - 0.5) * 220)
    clouds.add(c)
  }
  scene.add(clouds)

  disposables.push(box, water.geometry, water.material, waterTex, cloudMat)
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

  useEffect(() => {
    const canvas = canvasRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' })
    } catch {
      return // No WebGL: the CSS sky gradient behind the canvas still shows
    }
    // Rendered at reduced resolution: it is blurred anyway, and it keeps the pixel look
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1) * 0.6)

    const biome = BIOMES[pickBiome(biomeSetting)]
    const disposables = []
    const scene = new THREE.Scene()
    const sky = skyTexture(biome.sky)
    disposables.push(sky)
    scene.background = sky
    scene.fog = new THREE.Fog(...biome.fog)
    scene.add(new THREE.AmbientLight(0xffffff, biome.light ?? 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(0.6, 1, 0.35)
    scene.add(sun)

    const { eyeY, clouds } = buildWorld(scene, disposables, biome)
    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200)
    camera.rotation.order = 'YXZ'
    camera.position.set(0.5, eyeY, 0.5)
    camera.rotation.x = -0.26

    const resize = () => {
      const w = window.innerWidth, hgt = window.innerHeight
      renderer.setSize(w, hgt, false)
      camera.aspect = w / hgt
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf, last = performance.now()
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (motionRef.current) {
        camera.rotation.y += dt * TURN_SPEED
        for (const c of clouds.children) {
          c.position.x += dt * 0.8
          if (c.position.x > 110) c.position.x -= 220
        }
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    }
  }, [biomeSetting])

  return (
    <div className="panorama" aria-hidden="true">
      <canvas ref={canvasRef} className={blur ? 'blurred' : ''} />
      <div className="panorama-shade" />
    </div>
  )
}
