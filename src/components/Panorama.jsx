import { useEffect, useRef, useState } from 'react'
import { worldTextures } from '../lib/textures'
import { BIOMES, SUNSET } from '../lib/biomes'
import { CLOUD_SPAN, CUTOUT, PLANTS } from '../lib/worldgen'
import { loadWorld } from '../lib/sceneLoader'
import { createRenderer, hexColor } from '../lib/gl'
import { useSettings } from '../lib/settings'

// A procedurally generated voxel world, viewed from a hilltop by a slowly
// turning camera — the same idea as a game's rotating menu panorama.
//
// The world is built in a Web Worker (worldgen.js) and drawn with a tiny WebGL
// renderer (gl.js): only faces that touch air are meshed, and each corner is
// darkened by the blocks around it (ambient occlusion) with fixed per-face
// brightness — the classic blocky-game look, with no real-time lights needed.

const TURN_SPEED = (Math.PI * 2) / 160 // one full turn every ~160s
const FRAME_MS = 1000 / 30 // cap at 30fps: plenty for a slow pan, kinder to batteries
const FOV = 75

// Render scale: low when blurred (no one can tell), full sharpness otherwise
const pixelRatio = (blur) => (blur ? Math.min(window.devicePixelRatio, 1) * 0.6 : Math.min(window.devicePixelRatio, 1.5))

// Flat disc for the water surface, centred on the camera like the terrain circle
function disc(cx, y, cz, radius, segments) {
  const pos = [cx, y, cz], uv = [0.5, 0.5], idx = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pos.push(cx + Math.cos(a) * radius, y, cz - Math.sin(a) * radius)
    uv.push((Math.cos(a) + 1) / 2, (Math.sin(a) + 1) / 2)
    if (i > 0) idx.push(0, i, i + 1)
  }
  return { pos: new Float32Array(pos), uv: new Float32Array(uv), idx: new Uint32Array(idx) }
}

// Square facing `target`, for the sun
function billboard(center, target, size) {
  const n = center.map((c, i) => target[i] - c)
  const len = Math.hypot(...n)
  const [nx, ny, nz] = n.map((v) => v / len)
  let right = [nz, 0, -nx] // up × normal
  const rl = Math.hypot(...right)
  right = right.map((v) => v / rl)
  const up = [ny * right[2] - nz * right[1], nz * right[0] - nx * right[2], nx * right[1] - ny * right[0]]
  const h = size / 2
  const corner = (a, b) => center.map((c, i) => c + right[i] * a * h + up[i] * b * h)
  return {
    pos: new Float32Array([...corner(-1, -1), ...corner(1, -1), ...corner(1, 1), ...corner(-1, 1)]),
    idx: new Uint32Array([0, 1, 2, 0, 2, 3]),
  }
}

// Turn generated world data into things to draw
function buildScene(r, world, biome, time) {
  const sunset = time === 'sunset'
  const { eyeY, half } = world
  const sources = worldTextures(biome.palette)
  const tint = hexColor(sunset ? SUNSET.tint : '#ffffff', true)
  const solid = [], cutout = [], see = []

  for (const [tex, b] of Object.entries(world.buffers)) {
    const item = { mesh: r.mesh(b), map: r.texture(sources[tex]()), tint }
    if (PLANTS.has(tex)) see.push({ ...item, alphaTest: 0.5, cull: false })
    else if (CUTOUT.has(tex)) cutout.push({ ...item, alphaTest: 0.5 })
    else solid.push(item)
  }

  // Water (or ice) as one flat disc at sea level; water slowly ripples
  const frozen = biome.water === 'ice'
  const water = {
    mesh: r.mesh(disc(0.5, biome.sea + (frozen ? 0.5 : 0.4), 0.5, half, 64)),
    map: r.texture(sources[biome.water](), { repeat: true }),
    tint: tint.map((c) => c * world.waterShade),
    uvTransform: [half * 2, half * 2, 0, 0],
    ...(frozen ? {} : { blend: true, opacity: 0.8 }),
  }

  // Cloud layer: drawn twice side by side so it can drift forever and wrap seamlessly
  const cloudMesh = r.mesh(world.cloud)
  const cloudTint = hexColor(sunset ? SUNSET.cloud : '#ffffff', true)
  const clouds = [0, -CLOUD_SPAN].map((x) => ({
    mesh: cloudMesh, tint: cloudTint, blend: true, opacity: 0.82, fog: false, offset: [x, world.cloudY, 0],
  }))

  // A square sun, in view when the page opens; the turning camera then sweeps past it.
  // At sunset it sits big and orange just above the horizon.
  const sun = {
    mesh: r.mesh(billboard([35, eyeY + (sunset ? 10 : 40), -120], [0.5, eyeY, 0.5], sunset ? 22 : 16)),
    tint: hexColor(sunset ? '#ffa64d' : '#fff6c8', true),
    fog: false,
    cull: false,
  }

  const items = [...solid, sun, ...cutout, ...see, ...(frozen ? [water] : []), ...(frozen ? [] : [water]), ...clouds]
  return { items, clouds, water: frozen ? null : water }
}

export default function Panorama({ scene: picked, onReady }) {
  const canvasRef = useRef(null)
  const { motion, blur } = useSettings()
  const [ready, setReady] = useState(false)
  const motionRef = useRef(motion)
  motionRef.current = motion
  const blurRef = useRef(blur)
  blurRef.current = blur
  const resizeRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = createRenderer(canvas)
    if (!renderer) return // No WebGL2: the blurred snapshot behind stays in place
    setReady(false)
    onReady?.(false)

    const { time } = picked
    const biome = BIOMES[picked.biome]
    const sunset = time === 'sunset'
    const [fogHex, fogNear, fogFar] = biome.fog
    const view = {
      sky: (sunset ? SUNSET.sky : biome.sky).map((c) => hexColor(c)),
      fog: { color: hexColor(sunset ? SUNSET.fog : fogHex, true), near: fogNear, far: fogFar },
      items: [],
    }
    const camera = {
      fov: FOV, near: 0.1, far: 220, position: [0.5, 0, 0.5], yaw: 0,
      // Close to level by default, so the horizon and sky fill the view like the game's menu;
      // a biome can look down into a valley instead
      pitch: biome.pitch ?? -0.1,
    }

    let world = null
    let sizedW = 0, sizedH = 0
    const draw = () => world && renderer.render(view, camera)
    const resize = () => {
      sizedW = window.innerWidth
      sizedH = window.innerHeight
      renderer.setSize(sizedW, sizedH, pixelRatio(blurRef.current))
      draw()
    }
    resize()
    resizeRef.current = resize
    window.addEventListener('resize', resize)

    // The world arrives from the background thread
    let cancelled = false
    performance.mark('world-start')
    loadWorld(picked.biome, time).then((data) => {
      if (cancelled) return
      world = buildScene(renderer, data, biome, time)
      view.items = world.items
      camera.position = [0.5, data.eyeY, 0.5]
      draw()
      performance.measure('world-build', 'world-start')
      setReady(true)
      onReady?.(true)
    })

    let raf, last = performance.now(), drift = 0
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      // Catch size changes that arrive without a resize event (e.g. a tab opened in the background)
      if (window.innerWidth !== sizedW || window.innerHeight !== sizedH) resize()
      if (!world || !motionRef.current || now - last < FRAME_MS) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      camera.yaw += dt * TURN_SPEED
      drift = (drift + dt * 0.8) % CLOUD_SPAN
      world.clouds[0].offset[0] = drift
      world.clouds[1].offset[0] = drift - CLOUD_SPAN
      if (world.water) {
        const t = world.water.uvTransform
        t[2] = (t[2] + dt * 0.03) % 1
        t[3] = (t[3] + dt * 0.015) % 1
      }
      draw()
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      resizeRef.current = null
    }
  }, [picked.biome, picked.time])

  // Switching blur on/off changes how sharply the world needs drawing
  useEffect(() => {
    resizeRef.current?.()
  }, [blur])

  return (
    <div className="panorama" aria-hidden="true">
      <canvas ref={canvasRef} className={[blur && 'blurred', ready && 'ready'].filter(Boolean).join(' ')} />
      <div className="panorama-shade" />
    </div>
  )
}
