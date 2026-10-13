import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { worldTextures } from '../lib/textures'
import { BIOMES, SUNSET, pickBiome, pickTime } from '../lib/biomes'
import { CLOUD_SPAN, CUTOUT, PLANTS, generateWorld } from '../lib/worldgen'
import { useSettings } from '../lib/settings'

// A procedurally generated voxel world, viewed from a hilltop by a slowly
// turning camera — the same idea as a game's rotating menu panorama.
//
// Instead of drawing every block as a cube, only faces that touch air are
// meshed, and each corner is darkened by the blocks around it (ambient
// occlusion) with fixed per-face brightness — the classic blocky-game look,
// with no real-time lights needed.

const TURN_SPEED = (Math.PI * 2) / 160 // one full turn every ~160s
const FRAME_MS = 1000 / 30 // cap at 30fps: plenty for a slow pan, kinder to batteries

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

// Turn generated world data into meshes. Runs on the main thread, but it's quick:
// the heavy lifting already happened in worldgen.js.
function addWorld(scene, disposables, world, biome, anisotropy, time) {
  const sunset = time === 'sunset'
  const { eyeY, half } = world
  const sources = worldTextures(biome.palette)
  const tint = new THREE.Color(sunset ? SUNSET.tint : 0xffffff)

  for (const [tex, b] of Object.entries(world.buffers)) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(b.pos, 3))
    geo.setAttribute('uv', new THREE.BufferAttribute(b.uv, 2))
    geo.setAttribute('color', new THREE.BufferAttribute(b.col, 3))
    geo.setIndex(new THREE.BufferAttribute(b.idx, 1))
    const map = texture(sources[tex](), anisotropy)
    const material = new THREE.MeshBasicMaterial({
      map,
      color: tint,
      vertexColors: true,
      ...(CUTOUT.has(tex) && { alphaTest: 0.5 }),
      ...(PLANTS.has(tex) && { side: THREE.DoubleSide }),
    })
    scene.add(new THREE.Mesh(geo, material))
    disposables.push(geo, map, material)
  }

  // Water (or ice) as one flat sheet at sea level; water slowly ripples
  const waterTex = texture(sources[biome.water](), anisotropy)
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping
  waterTex.repeat.set(half * 2, half * 2)
  const frozen = biome.water === 'ice'
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(half, 64), // round, to match the circle of terrain
    new THREE.MeshBasicMaterial({
      map: waterTex,
      color: tint.clone().multiplyScalar(world.waterShade),
      transparent: !frozen,
      opacity: frozen ? 1 : 0.8,
    }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(0.5, biome.sea + (frozen ? 0.5 : 0.4), 0.5)
  scene.add(water)

  // Cloud layer: two copies side by side so it can drift forever and wrap seamlessly
  const cloudGeo = new THREE.BufferGeometry()
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(world.cloud.pos, 3))
  cloudGeo.setAttribute('color', new THREE.BufferAttribute(world.cloud.col, 3))
  cloudGeo.setIndex(new THREE.BufferAttribute(world.cloud.idx, 1))
  const cloudMat = new THREE.MeshBasicMaterial({
    color: sunset ? SUNSET.cloud : 0xffffff,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    fog: false,
  })
  const clouds = [0, -CLOUD_SPAN].map((offset) => {
    const m = new THREE.Mesh(cloudGeo, cloudMat)
    m.position.set(offset, world.cloudY, 0)
    scene.add(m)
    return m
  })

  // A square sun, in view when the page opens; the turning camera then sweeps past it.
  // At sunset it sits big and orange just above the horizon.
  const sunGeo = new THREE.PlaneGeometry(sunset ? 22 : 16, sunset ? 22 : 16)
  const sunMat = new THREE.MeshBasicMaterial({ color: sunset ? 0xffa64d : 0xfff6c8, fog: false })
  const sun = new THREE.Mesh(sunGeo, sunMat)
  sun.position.set(35, eyeY + (sunset ? 10 : 40), -120)
  sun.lookAt(0.5, eyeY, 0.5)
  scene.add(sun)

  disposables.push(water.geometry, water.material, waterTex, cloudGeo, cloudMat, sunGeo, sunMat)
  return { clouds, waterTex: frozen ? null : waterTex }
}

// Build the world in a Web Worker when possible; fall back to the main thread
function requestWorld(biome, time, onReady) {
  let worker
  try {
    worker = new Worker(new URL('../lib/worldgen.worker.js', import.meta.url), { type: 'module' })
  } catch {
    const timer = setTimeout(() => onReady(generateWorld(biome, time)))
    return () => clearTimeout(timer)
  }
  worker.onmessage = ({ data }) => {
    worker.terminate()
    onReady(data.world)
  }
  worker.onerror = () => {
    worker.terminate()
    onReady(generateWorld(biome, time))
  }
  worker.postMessage({ biome, time })
  return () => worker.terminate()
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
  const { motion, blur, biome: biomeSetting, time: timeSetting } = useSettings()
  const [ready, setReady] = useState(false)
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
    setReady(false)

    const biomeId = pickBiome(biomeSetting)
    const biome = BIOMES[biomeId]
    const time = pickTime(timeSetting)
    const disposables = []
    const scene = new THREE.Scene()
    const sky = skyTexture(time === 'sunset' ? SUNSET.sky : biome.sky)
    disposables.push(sky)
    scene.background = sky
    const [fogColor, fogNear, fogFar] = biome.fog
    scene.fog = new THREE.Fog(time === 'sunset' ? SUNSET.fog : fogColor, fogNear, fogFar)

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 220)
    camera.rotation.order = 'YXZ'
    // Close to level by default, so the horizon and sky fill the view like the game's menu;
    // a biome can look down into a valley instead
    camera.rotation.x = biome.pitch ?? -0.1

    let sizedW = 0, sizedH = 0
    const resize = () => {
      sizedW = window.innerWidth
      sizedH = window.innerHeight
      // Hidden or minimized windows can report 0×0; never let the camera's aspect go invalid
      const w = Math.max(1, sizedW), hgt = Math.max(1, sizedH)
      renderer.setSize(w, hgt, false)
      camera.aspect = w / hgt
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    resize()
    resizeRef.current = resize
    window.addEventListener('resize', resize)

    // The world arrives from the background thread; until then only the sky is drawn
    let world = null
    let cancelled = false
    performance.mark('world-start')
    const cancelWorld = requestWorld(biomeId, time, async (data) => {
      if (cancelled) return
      performance.mark('world-add')
      const added = addWorld(scene, disposables, data, biome, renderer.capabilities.getMaxAnisotropy(), time)
      camera.position.set(0.5, data.eyeY, 0.5)
      // Compile the GPU shaders in the background (where the browser supports it)
      // so the first frame with the world in it doesn't freeze the page
      await renderer.compileAsync(scene, camera).catch(() => {})
      if (cancelled) return
      world = added
      resize()
      performance.measure('world-build', 'world-start')
      setReady(true)
    })

    let raf, last = performance.now(), drift = 0
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      // Catch size changes that arrive without a resize event (e.g. a tab opened in the background)
      if (window.innerWidth !== sizedW || window.innerHeight !== sizedH) resize()
      if (!world || !motionRef.current || now - last < FRAME_MS) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      camera.rotation.y += dt * TURN_SPEED
      drift = (drift + dt * 0.8) % CLOUD_SPAN
      world.clouds[0].position.x = drift
      world.clouds[1].position.x = drift - CLOUD_SPAN
      if (world.waterTex) {
        world.waterTex.offset.x = (world.waterTex.offset.x + dt * 0.03) % 1
        world.waterTex.offset.y = (world.waterTex.offset.y + dt * 0.015) % 1
      }
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelWorld()
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      rendererRef.current = resizeRef.current = null
    }
  }, [biomeSetting, timeSetting])

  // Switching blur on/off changes how sharply the world needs drawing
  useEffect(() => {
    if (!rendererRef.current) return
    rendererRef.current.setPixelRatio(pixelRatio(blur))
    resizeRef.current?.()
  }, [blur])

  return (
    <div className="panorama" aria-hidden="true">
      <canvas ref={canvasRef} className={[blur && 'blurred', ready && 'ready'].filter(Boolean).join(' ')} />
      <div className="panorama-shade" />
    </div>
  )
}
