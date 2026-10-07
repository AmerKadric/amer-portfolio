import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { textures, rng } from '../lib/textures'
import { useSettings } from '../lib/settings'

// A procedurally generated voxel world, viewed from a hilltop by a slowly
// turning camera — the same idea as a game's rotating menu panorama.

const SIZE = 112
const SEA = 10
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

function buildWorld(scene, disposables) {
  const noise = makeNoise(7)
  const heightAt = (x, z) => {
    const n = noise(x * 0.045 + 40, z * 0.045 + 40)
    return Math.round(4 + n * 22)
  }

  const half = SIZE / 2
  const heights = []
  for (let x = -half; x < half; x++) {
    heights[x + half] = []
    for (let z = -half; z < half; z++) heights[x + half][z + half] = heightAt(x, z)
  }
  const h = (x, z) => heights[x + half]?.[z + half] ?? heightAt(x, z)

  const blocks = { grass: [], dirt: [], stone: [], sand: [], log: [], leaves: [] }
  const r = rng(99)

  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const top = h(x, z)
      const floor = Math.min(top, h(x + 1, z), h(x - 1, z), h(x, z + 1), h(x, z - 1)) - 1
      const beach = top <= SEA + 1
      for (let y = top; y >= Math.max(floor, top - 6); y--) {
        const depth = top - y
        let type
        if (depth === 0) type = beach ? 'sand' : top > 21 ? 'stone' : 'grass'
        else if (depth < 4) type = beach ? 'sand' : 'dirt'
        else type = 'stone'
        blocks[type].push(x, y, z)
      }
    }
  }

  // Trees on grass, keeping the camera's hilltop clear
  const leaves = new Set()
  for (let x = -half + 2; x < half - 2; x++) {
    for (let z = -half + 2; z < half - 2; z++) {
      const top = h(x, z)
      if (top <= SEA + 1 || top > 21 || Math.abs(x) + Math.abs(z) < 5 || r() > 0.022) continue
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
    }
  }
  leaves.forEach((k) => blocks.leaves.push(...k.split(',').map(Number)))

  const tex = Object.fromEntries(Object.entries(textures).map(([k, fn]) => [k, texture(fn())]))
  const mat = (t) => new THREE.MeshLambertMaterial({ map: t })
  const m = {
    grassTop: mat(tex.grassTop), grassSide: mat(tex.grassSide), dirt: mat(tex.dirt),
    stone: mat(tex.stone), sand: mat(tex.sand), logSide: mat(tex.logSide), logTop: mat(tex.logTop),
    leaves: mat(tex.leaves),
  }
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  const materials = {
    grass: [m.grassSide, m.grassSide, m.grassTop, m.dirt, m.grassSide, m.grassSide],
    dirt: m.dirt,
    stone: m.stone,
    sand: m.sand,
    log: [m.logSide, m.logSide, m.logTop, m.logTop, m.logSide, m.logSide],
    leaves: m.leaves,
  }

  const box = new THREE.BoxGeometry(1, 1, 1)
  const matrix = new THREE.Matrix4()
  for (const [type, pos] of Object.entries(blocks)) {
    const count = pos.length / 3
    const mesh = new THREE.InstancedMesh(box, materials[type], count)
    for (let i = 0; i < count; i++) {
      matrix.setPosition(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
      mesh.setMatrixAt(i, matrix)
    }
    scene.add(mesh)
  }

  // Water as one flat sheet at sea level
  tex.water.wrapS = tex.water.wrapT = THREE.RepeatWrapping
  tex.water.repeat.set(SIZE, SIZE)
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshLambertMaterial({ map: tex.water, transparent: true, opacity: 0.82 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(-0.5, SEA + 0.4, -0.5)
  scene.add(water)

  // Flat, blocky clouds that drift overhead
  // Stand above the tallest ground nearby so the view opens over the landscape
  let peak = SEA
  for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) peak = Math.max(peak, h(x, z))
  const eyeY = peak + 8
  const clouds = new THREE.Group()
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false })
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Mesh(box, cloudMat)
    c.scale.set(8 + r() * 16, 2, 6 + r() * 12)
    c.position.set((r() - 0.5) * 220, eyeY + 22 + r() * 3, (r() - 0.5) * 220)
    clouds.add(c)
  }
  scene.add(clouds)

  disposables.push(box, water.geometry, water.material, cloudMat, ...Object.values(m), ...Object.values(tex))
  return { eyeY, clouds }
}

function skyTexture() {
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 256
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#5f8fdc')
  grad.addColorStop(0.55, '#a9c6f2')
  grad.addColorStop(1, '#c4d8f6')
  g.fillStyle = grad
  g.fillRect(0, 0, 2, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Panorama() {
  const canvasRef = useRef(null)
  const { motion, blur } = useSettings()
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

    const disposables = []
    const scene = new THREE.Scene()
    const sky = skyTexture()
    disposables.push(sky)
    scene.background = sky
    scene.fog = new THREE.Fog('#bcd2f4', 28, 62)
    scene.add(new THREE.AmbientLight(0xffffff, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(0.6, 1, 0.35)
    scene.add(sun)

    const { eyeY, clouds } = buildWorld(scene, disposables)
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
  }, [])

  return (
    <div className="panorama" aria-hidden="true">
      <canvas ref={canvasRef} className={blur ? 'blurred' : ''} />
      <div className="panorama-shade" />
    </div>
  )
}
