// The hidden walk-around game: the background biome turned into an editable
// block world, with first-person movement, block breaking/placing, a
// day/night cycle, health, an iron sword, and zombies at night. Drawn with the
// same tiny WebGL renderer as the panorama.

import { createRenderer, hexColor } from '../lib/gl'
import { createMobs } from './mobs'
import { chain, translate, rotateX, rotateY, rotateZ, scale } from '../lib/mat4'
import { playHit, playHurt } from '../lib/sound'
import { worldTextures } from '../lib/textures'
import { SUNSET } from '../lib/biomes'
import {
  planWorld, faceMesher, addPlant, packBuffers, cloudGeometry, toLinear,
  BLOCK_FACES, FACES, FACE_DATA, INSET, SEE_THROUGH, PLANTS, CUTOUT, CLOUD_SPAN,
} from '../lib/worldgen'

// ---------- Tuning ----------
const HEIGHT = 96 // world height in blocks
const CHUNK = 16
const REACH = 5
const DAY_SECONDS = 300 // one full day/night cycle
const GRAVITY = 28
const JUMP = 8.6
const WATER_EXIT = 9.6 // enough to clear a one-block bank from the water's surface
const WALK = 4.3
const SPRINT = 6.2
const PLAYER_W = 0.3 // half width
const PLAYER_H = 1.8
const EYE = 1.62
export const MAX_HEALTH = 20 // 10 hearts
const ATTACK_REACH = 3.5
const ATTACK_COOLDOWN = 0.4
const SWORD_DAMAGE = 6 // 3 hearts: a zombie takes 4 hits
const FIST_DAMAGE = 1

// Hotbar: the iron sword, then blocks to build with
export const HOTBAR = ['ironSword', 'grass', 'dirt', 'stone', 'cobble', 'planks', 'log', 'glass', 'bricks']
const isTool = (name) => name === 'ironSword'

const NIGHT_SKY = ['#04060e', '#0b1226', '#18213d']
const NIGHT_FOG = '#0e1424'
const NIGHT_LIGHT = [0.17, 0.19, 0.3]

const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const mix3 = (a, b, c, wa, wb, wc) => [0, 1, 2].map((i) => a[i] * wa + b[i] * wb + c[i] * wc)

export function createGame(canvas, { biomeId, time }, { onUnderwater, onHealth, onHurt, onDeath } = {}) {
  const r = createRenderer(canvas)
  if (!r) return null

  // ---------- World data ----------
  const plan = planWorld(biomeId)
  const { biome, HALF, SIZE, sea, h, terrainBlock, extra } = plan
  const names = ['air', ...Object.keys(BLOCK_FACES), ...PLANTS]
  const id = Object.fromEntries(names.map((n, i) => [n, i]))
  const grid = new Uint8Array(SIZE * SIZE * HEIGHT)
  const at = (x, y, z) => ((x + HALF) * SIZE + (z + HALF)) * HEIGHT + y
  const inWorld = (x, y, z) => x >= -HALF && x < HALF && z >= -HALF && z < HALF && y >= 0 && y < HEIGHT
  const inCircle = (x, z) => Math.hypot(x - 0.5, z - 0.5) <= HALF - 0.5

  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      if (!inCircle(x, z)) continue
      const top = Math.min(h(x, z), HEIGHT - 1)
      for (let y = 0; y <= top; y++) grid[at(x, y, z)] = id[terrainBlock(x, y, z, top)]
    }
  }
  for (const [k, kind] of extra) {
    const y = k % 256, xz = Math.floor(k / 256)
    const x = Math.floor(xz / 256) - 128, z = (xz % 256) - 128
    if (inWorld(x, y, z) && inCircle(x, z)) grid[at(x, y, z)] = id[kind]
  }
  for (const [kind, x, y, z] of plan.plants) {
    if (inWorld(x, y, z) && inCircle(x, z) && !grid[at(x, y, z)]) grid[at(x, y, z)] = id[kind]
  }

  const nameAt = (x, y, z) => (inWorld(x, y, z) ? names[grid[at(x, y, z)]] : y < 0 ? 'stone' : 'air')
  const isPlant = (n) => PLANTS.has(n)
  // Blocks you bump into
  const blocks = (x, y, z) => {
    const n = nameAt(x, y, z)
    return n !== 'air' && !isPlant(n)
  }
  // Hides the face next to it
  const hides = (x, y, z) => {
    const n = nameAt(x, y, z)
    return n !== 'air' && !isPlant(n) && !SEE_THROUGH.has(n)
  }
  // Darkens corners
  const occludes = (x, y, z) => {
    const n = nameAt(x, y, z)
    return n !== 'air' && !isPlant(n) && n !== 'cactus' && n !== 'glass'
  }
  // Below sea level and not inside a block: you're in the water
  const isWater = (x, y, z) => y <= sea && inCircle(x, z) && nameAt(x, y, z) === 'air'

  // ---------- Textures & materials ----------
  const light = biome.light ?? 1
  const sources = worldTextures(biome.palette)
  const textures = {}
  const tex = (name) => (textures[name] ??= r.texture(sources[name]()))
  const itemFor = (name, mesh) => {
    const item = { mesh, map: tex(name) }
    if (PLANTS.has(name)) return { ...item, alphaTest: 0.5, cull: false, layer: 2 }
    if (CUTOUT.has(name)) return { ...item, alphaTest: 0.5, layer: 1 }
    return { ...item, layer: 0 }
  }

  // ---------- Chunk meshing ----------
  const chunks = new Map() // "cx,cz" -> [items]
  let itemsDirty = true // the draw list needs rebuilding
  const chunkKey = (cx, cz) => `${cx},${cz}`
  const plantShade = toLinear(0.9 * light)

  function meshChunk(cx, cz) {
    const buffers = {}
    const buffer = (t) => (buffers[t] ??= { pos: [], uv: [], col: [], idx: [] })
    const addFace = faceMesher(buffer, occludes, light)
    const x0 = cx * CHUNK, z0 = cz * CHUNK
    for (let x = x0; x < x0 + CHUNK; x++) {
      for (let z = z0; z < z0 + CHUNK; z++) {
        if (x < -HALF || x >= HALF || z < -HALF || z >= HALF) continue
        const base = at(x, 0, z)
        for (let y = 0; y < HEIGHT; y++) {
          const b = grid[base + y]
          if (!b) continue
          const n = names[b]
          if (isPlant(n)) {
            addPlant(buffer, [n, x, y, z, 0, 0], plantShade)
            continue
          }
          for (let f = 0; f < 6; f++) {
            const [nx, ny, nz] = FACES[f].n
            if (y === 0 && f === 3) continue
            const nb = nameAt(x + nx, y + ny, z + nz)
            if (n === 'glass' && nb === 'glass') continue
            if (!hides(x + nx, y + ny, z + nz) || INSET[n]) addFace(x, y, z, n, f)
          }
        }
      }
    }
    return Object.entries(packBuffers(buffers)).map(([t, b]) => itemFor(t, r.mesh(b)))
  }

  function rebuildChunk(cx, cz) {
    const k = chunkKey(cx, cz)
    chunks.get(k)?.forEach((item) => r.deleteMesh(item.mesh))
    chunks.set(k, meshChunk(cx, cz))
    itemsDirty = true
  }

  const cmin = Math.floor(-HALF / CHUNK), cmax = Math.floor((HALF - 1) / CHUNK)
  for (let cx = cmin; cx <= cmax; cx++) for (let cz = cmin; cz <= cmax; cz++) rebuildChunk(cx, cz)

  // Animals that wander around, and zombies at night
  const mobs = createMobs({
    renderer: r, plan, light, itemFor, blocks, nameAt, isWater, inCircle,
    onAttackPlayer: (damage, fromX, fromZ) => hurtPlayer(damage, fromX, fromZ),
  })

  // ---------- Sky things ----------
  const frozen = biome.water === 'ice'
  const waterShade = toLinear(0.95 * light)
  const waterTex = r.texture(sources[biome.water](), { repeat: true })
  const water = {
    mesh: r.mesh(disc(0.5, sea + (frozen ? 0.5 : 0.4), 0.5, HALF, 64)),
    map: waterTex,
    tint: [waterShade, waterShade, waterShade],
    uvTransform: [HALF * 2, HALF * 2, 0, 0],
    cull: false, // visible from underneath while swimming
    ...(frozen ? {} : { blend: true, opacity: 0.8 }),
  }
  const cloudMesh = r.mesh(cloudGeometry(biome.cloudCover ?? 0.35, 5))
  const cloudY = Math.max(plan.peak + 30, 70)
  const clouds = [0, -CLOUD_SPAN].map((x) => ({ mesh: cloudMesh, blend: true, opacity: 0.82, fog: false, offset: [x, cloudY, 0] }))

  const quad4 = () => r.mesh({ pos: new Float32Array(12), idx: new Uint32Array([0, 1, 2, 0, 2, 3]) }, { dynamic: true })
  const sun = { mesh: quad4(), tint: hexColor('#fff6c8', true), glow: true, fog: false, cull: false }
  const moon = { mesh: quad4(), tint: hexColor('#e8ecf4', true), glow: true, fog: false, cull: false }
  const stars = { mesh: r.mesh(starField(500)), tint: [1, 1, 1], glow: true, fog: false, cull: false, blend: true, opacity: 0, depthWrite: false, offset: [0, 0, 0] }
  const outline = {
    mesh: r.mesh(cubeEdges(), { lines: true }),
    tint: [0, 0, 0], glow: true, fog: false, blend: true, opacity: 0.7, offset: [0, 0, 0], depthWrite: false,
  }

  // ---------- Scene ----------
  const [fogHex, fogNear, fogFar] = biome.fog
  const view = { sky: [], fog: { color: [0, 0, 0], near: fogNear, far: Math.max(fogFar, 90) }, ambient: [1, 1, 1], items: [] }
  let target = null // block the crosshair is on

  // The world's draw lists only change when blocks do; creatures are added every frame
  let before = [], after = []
  function collectItems() {
    const world = [...chunks.values()].flat()
    before = [stars, sun, moon, ...world.filter((i) => i.layer === 0)]
    after = [...world.filter((i) => i.layer === 1), ...world.filter((i) => i.layer === 2), water, ...clouds]
    itemsDirty = false
  }

  // ---------- Player ----------
  const topSolid = (x, z) => {
    for (let y = HEIGHT - 1; y >= 0; y--) if (blocks(x, y, z)) return y
    return 0
  }
  // Start on the nearest dry land to the middle of the world (the centre can be a lake)
  const spawnPoint = (() => {
    for (let radius = 0; radius < HALF - 4; radius++) {
      for (let i = 0; i < Math.max(1, radius * 8); i++) {
        const a = (i / Math.max(1, radius * 8)) * Math.PI * 2
        const x = Math.round(Math.cos(a) * radius), z = Math.round(Math.sin(a) * radius)
        const top = topSolid(x, z)
        if (top > sea && !blocks(x, top + 1, z) && !blocks(x, top + 2, z)) return { x, y: top + 0.5, z }
      }
    }
    return { x: 0, y: topSolid(0, 0) + 0.5, z: 0 }
  })()
  const spawn = () => ({ ...spawnPoint })
  const player = {
    ...spawn(), vx: 0, vy: 0, vz: 0, kx: 0, kz: 0, yaw: 0, pitch: -0.15, onGround: false, inWater: false,
    health: MAX_HEALTH, invulnerable: 0, sinceHurt: 99, regen: 0, dead: false, fallPeak: null,
  }

  // ---------- Health ----------
  function hurtPlayer(amount, fromX, fromZ) {
    const p = player
    if (p.dead || (fromX != null && p.invulnerable > 0)) return
    p.health = Math.max(0, p.health - amount)
    p.invulnerable = 0.5
    p.sinceHurt = 0
    if (fromX != null) {
      // Knocked back, away from whatever hit you
      const dx = p.x - fromX, dz = p.z - fromZ, d = Math.hypot(dx, dz) || 1
      p.kx = (dx / d) * 7
      p.kz = (dz / d) * 7
      p.vy = Math.max(p.vy, 5)
    }
    playHurt()
    onHurt?.()
    onHealth?.(p.health)
    if (p.health === 0) {
      p.dead = true
      Object.assign(input, { forward: 0, strafe: 0, jump: false })
      onDeath?.()
    }
  }

  function respawn() {
    Object.assign(player, spawn(), {
      vx: 0, vy: 0, vz: 0, kx: 0, kz: 0, health: MAX_HEALTH, invulnerable: 1, sinceHurt: 99, dead: false, fallPeak: null,
    })
    onHealth?.(player.health)
  }

  // Health slowly comes back after a few seconds without being hurt
  function heal(dt) {
    const p = player
    p.invulnerable = Math.max(0, p.invulnerable - dt)
    p.sinceHurt += dt
    if (p.dead || p.health >= MAX_HEALTH || p.sinceHurt < 4) return
    p.regen += dt
    if (p.regen >= 2.5) {
      p.regen = 0
      p.health = Math.min(MAX_HEALTH, p.health + 1)
      onHealth?.(p.health)
    }
  }

  const cell = (v) => Math.round(v) // block b spans b-0.5 .. b+0.5
  function collides(px, py, pz) {
    for (let x = cell(px - PLAYER_W); x <= cell(px + PLAYER_W); x++) {
      for (let y = cell(py + 0.001); y <= cell(py + PLAYER_H - 0.001); y++) {
        for (let z = cell(pz - PLAYER_W); z <= cell(pz + PLAYER_W); z++) if (blocks(x, y, z)) return true
      }
    }
    return false
  }

  // ---------- Input state (set by the UI) ----------
  const input = { forward: 0, strafe: 0, jump: false, sprint: false, autoJump: false }
  let selected = 0

  function step(dt) {
    const p = player
    p.inWater = isWater(cell(p.x), cell(p.y + 0.4), cell(p.z))
    const speed = (input.sprint && !p.inWater ? SPRINT : WALK) * (p.inWater ? 0.6 : 1)
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw)
    let mx = -sin * input.forward + cos * input.strafe
    let mz = -cos * input.forward - sin * input.strafe
    const len = Math.hypot(mx, mz)
    if (len > 1) { mx /= len; mz /= len }
    // Knockback fades quickly and adds to your own movement
    const drag = Math.max(0, 1 - dt * 8)
    p.kx *= drag
    p.kz *= drag
    p.vx = mx * speed + p.kx
    p.vz = mz * speed + p.kz

    if (p.inWater) {
      p.vy = Math.max(p.vy - 8 * dt, -2.5)
      if (input.jump) p.vy = Math.max(p.vy, 3.6) // swim up (never cancels a stronger push)
    } else {
      p.vy = Math.max(p.vy - GRAVITY * dt, -50)
      if (input.jump && p.onGround) p.vy = JUMP
    }

    // Move one axis at a time in small steps, stopping at walls
    const steps = Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy), Math.abs(p.vz)) * dt / 0.2) || 1
    const sdt = dt / steps
    let hitWall = false
    const wasOnGround = p.onGround
    p.onGround = false
    for (let i = 0; i < steps; i++) {
      if (!collides(p.x + p.vx * sdt, p.y, p.z)) p.x += p.vx * sdt
      else hitWall = true
      if (!collides(p.x, p.y, p.z + p.vz * sdt)) p.z += p.vz * sdt
      else hitWall = true
      if (!collides(p.x, p.y + p.vy * sdt, p.z)) p.y += p.vy * sdt
      else {
        if (p.vy < 0) p.onGround = true
        p.vy = 0
      }
    }
    // Hop up single blocks automatically (touch controls), like the game's auto-jump
    if (input.autoJump && hitWall && p.onGround && len > 0.1 && !collides(p.x, p.y + 1.1, p.z)) p.vy = JUMP
    // Swimming into the edge while jumping (or moving, on touch) pops you out onto the bank
    if (p.inWater && hitWall && len > 0.1 && (input.jump || input.autoJump) && !collides(p.x, p.y + 1.6, p.z)) p.vy = WATER_EXIT

    // Stay inside the world's circle; fall out the bottom and you respawn
    const d = Math.hypot(p.x - 0.5, p.z - 0.5), limit = HALF - 2
    if (d > limit) {
      p.x = 0.5 + ((p.x - 0.5) / d) * limit
      p.z = 0.5 + ((p.z - 0.5) / d) * limit
    }
    // Fall damage: more than 3 blocks hurts (landing in water is safe)
    if (p.inWater) p.fallPeak = p.y
    else if (!p.onGround) p.fallPeak = Math.max(p.fallPeak ?? p.y, p.y)
    if (p.onGround) {
      const fall = (p.fallPeak ?? p.y) - p.y
      if (!wasOnGround && fall > 3.2) hurtPlayer(Math.floor(fall - 3))
      p.fallPeak = p.y
    }
    if (p.y < -20) hurtPlayer(MAX_HEALTH) // fell out of the world
  }

  // ---------- Aiming ----------
  function lookDir() {
    const cp = Math.cos(player.pitch)
    return [-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp]
  }

  // Step through the block grid along the view ray (blocks are centred on integers).
  // `throughPlants` lets attacks pass grass and flowers, like in the real game.
  function raycast(throughPlants = false) {
    const o = [player.x + 0.5, player.y + EYE + 0.5, player.z + 0.5]
    const d = lookDir()
    const c = o.map(Math.floor)
    const stepDir = d.map((v) => (v > 0 ? 1 : -1))
    const tDelta = d.map((v) => (v === 0 ? Infinity : Math.abs(1 / v)))
    const tMax = d.map((v, i) => (v === 0 ? Infinity : ((v > 0 ? c[i] + 1 - o[i] : o[i] - c[i]) / Math.abs(v))))
    let prev = null
    for (let t = 0; t <= REACH; ) {
      const n = nameAt(c[0], c[1], c[2])
      if (n !== 'air' && !(throughPlants && isPlant(n))) return { hit: [...c], prev }
      prev = [...c]
      const axis = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : tMax[1] < tMax[2] ? 1 : 2
      t = tMax[axis]
      c[axis] += stepDir[axis]
      tMax[axis] += tDelta[axis]
    }
    return null
  }

  // Rebuild the chunk holding a block, plus neighbours it touches (for culling and shading)
  function changed(x, z) {
    const touched = new Set()
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) touched.add(chunkKey(Math.floor((x + dx) / CHUNK), Math.floor((z + dz) / CHUNK)))
    touched.forEach((k) => {
      const [cx, cz] = k.split(',').map(Number)
      if (chunks.has(k)) rebuildChunk(cx, cz)
    })
  }

  // Left click / Break: hit a creature if one's in reach and in front of any block, otherwise break the block
  let attackCooldown = 0
  function primary() {
    if (player.dead) return false
    swing()
    const eye = [player.x, player.y + EYE, player.z]
    const hit = mobs.raycast(eye, lookDir(), ATTACK_REACH)
    const block = raycast(true)
    const blockDist = block ? Math.hypot(...block.hit.map((c, i) => c - eye[i])) - 0.5 : Infinity
    if (hit && hit.distance < blockDist) {
      if (attackCooldown > 0) return false
      attackCooldown = ATTACK_COOLDOWN
      mobs.damage(hit.mob, HOTBAR[selected] === 'ironSword' ? SWORD_DAMAGE : FIST_DAMAGE, player.x, player.z)
      playHit()
      return true
    }
    return breakBlock()
  }

  function breakBlock() {
    const t = raycast()
    if (!t) return false
    const [x, y, z] = t.hit
    if (!inWorld(x, y, z)) return false
    grid[at(x, y, z)] = 0
    if (inWorld(x, y + 1, z) && isPlant(names[grid[at(x, y + 1, z)]])) grid[at(x, y + 1, z)] = 0 // plants fall with their ground
    changed(x, z)
    return true
  }

  function placeBlock() {
    if (player.dead || isTool(HOTBAR[selected])) return false
    const t = raycast()
    if (!t?.prev) return false
    const [x, y, z] = t.prev
    if (!inWorld(x, y, z) || !inCircle(x, z)) return false
    const existing = names[grid[at(x, y, z)]]
    if (existing !== 'air' && !isPlant(existing)) return false
    // Don't build inside yourself
    const p = player
    if (Math.abs(x - p.x) < 0.5 + PLAYER_W && Math.abs(z - p.z) < 0.5 + PLAYER_W && y + 0.5 > p.y && y - 0.5 < p.y + PLAYER_H) return false
    grid[at(x, y, z)] = id[HOTBAR[selected]]
    changed(x, z)
    swing()
    return true
  }

  // ---------- The item in your hand ----------
  // Drawn on top of the world in camera space (x right, y up, looking down -z)
  const handItems = {}
  function handItemsFor(name) {
    if (handItems[name]) return handItems[name]
    if (name === 'ironSword') {
      // A flat pixel sprite, stacked a few layers deep so it has some thickness
      const pos = [], uv = [], idx = []
      for (const z of [-0.035, -0.012, 0.012, 0.035]) {
        const start = pos.length / 3
        pos.push(-0.5, -0.5, z, 0.5, -0.5, z, 0.5, 0.5, z, -0.5, 0.5, z)
        uv.push(0, 0, 1, 0, 1, 1, 0, 1)
        idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
      }
      const map = r.texture(sources.ironSword())
      const shade = toLinear(light)
      const col = new Float32Array(pos.length).fill(shade)
      return (handItems[name] = [{
        mesh: r.mesh({ pos: new Float32Array(pos), uv: new Float32Array(uv), col, idx: new Uint32Array(idx) }),
        map, alphaTest: 0.5, cull: false, fog: false, model: new Float32Array(16),
      }])
    }
    // A small block: one cube, textured per face like the real thing
    const buffers = {}
    for (let f = 0; f < 6; f++) {
      const t = BLOCK_FACES[name][f]
      const b = (buffers[t] ??= { pos: [], uv: [], col: [], idx: [] })
      const v = toLinear(FACES[f].shade * light)
      const start = b.pos.length / 3
      for (const { p: c, uv: u } of FACE_DATA[f].corners) {
        b.pos.push(c[0] - 0.5, c[1] - 0.5, c[2] - 0.5)
        b.uv.push(u[0], u[1])
        b.col.push(v, v, v)
      }
      b.idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
    }
    return (handItems[name] = Object.entries(packBuffers(buffers)).map(([t, b]) => ({
      ...itemFor(t, r.mesh(b)), fog: false, model: new Float32Array(16),
    })))
  }

  let swingTime = 0 // counts down after an action
  let bob = 0
  function swing() {
    swingTime = 0.3
  }

  function handOverlay(dt) {
    if (player.dead) return []
    swingTime = Math.max(0, swingTime - dt)
    const s = Math.sin((1 - swingTime / 0.3) * Math.PI) * (swingTime > 0 ? 1 : 0) // 0 → 1 → 0
    const walking = player.onGround && Math.hypot(player.vx, player.vz) > 0.5
    bob += dt * (walking ? 10 : 0)
    const bx = Math.sin(bob) * 0.025, by = -Math.abs(Math.cos(bob)) * 0.03
    const name = HOTBAR[selected]
    const items = handItemsFor(name)
    // On touch screens the controls cover the bottom-right corner, so hold things a little higher
    const lift = input.autoJump ? 0.14 : 0
    const model = isTool(name)
      ? chain(
          // Handle bottom-right, blade angled up and in toward the middle; swings down on a hit
          translate(0.46 + bx - s * 0.18, -0.36 + lift + by + s * 0.05, -0.9 - s * 0.12),
          rotateY(2.15), rotateZ(-0.05 - s * 0.8), rotateX(s * 0.35), scale(0.5),
        )
      : chain(
          translate(0.52 + bx - s * 0.2, -0.46 + lift + by + s * 0.06, -0.95 - s * 0.1),
          rotateX(0.25 - s * 0.6), rotateY(0.78), scale(0.36),
        )
    for (const item of items) item.model.set(model)
    return items
  }

  // ---------- Day / night ----------
  // 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight
  let dayTime = time === 'sunset' ? 0.47 : 0.12
  const daySky = biome.sky.map((c) => hexColor(c))
  const sunsetSky = SUNSET.sky.map((c) => hexColor(c))
  const nightSky = NIGHT_SKY.map((c) => hexColor(c))
  const dayFog = hexColor(fogHex, true), sunsetFog = hexColor(SUNSET.fog, true), nightFog = hexColor(NIGHT_FOG, true)
  const sunsetLight = hexColor(SUNSET.tint, true).map((c) => c * SUNSET.light)

  function updateSky(eye) {
    const angle = dayTime * Math.PI * 2
    const elevation = Math.sin(angle)
    const day = smoothstep(0.02, 0.35, elevation)
    const night = smoothstep(0.05, -0.25, elevation)
    const dusk = Math.max(0, 1 - day - night)
    view.sky = [0, 1, 2].map((i) => mix3(daySky[i], sunsetSky[i], nightSky[i], day, dusk, night))
    view.fog.color = mix3(dayFog, sunsetFog, nightFog, day, dusk, night)
    view.ambient = mix3([1, 1, 1], sunsetLight, NIGHT_LIGHT, day, dusk, night)
    stars.opacity = night
    stars.offset = eye

    // Sun and moon travel across the sky opposite each other, always far away from you
    const dir = norm([Math.cos(angle), Math.sin(angle), -0.35])
    r.updateMesh(sun.mesh, billboard(eye, dir, 150, 16))
    r.updateMesh(moon.mesh, billboard(eye, dir.map((v) => -v), 150, 12))
    sun.tint = elevation < 0.15 ? hexColor('#ffb062', true) : hexColor('#fff6c8', true)
    return { day, night }
  }

  // ---------- Loop ----------
  let raf = 0, last = performance.now(), drift = 0, size = [0, 0]
  const camera = { fov: 75, near: 0.05, far: 260, position: [0, 0, 0], yaw: 0, pitch: 0 }

  function resize() {
    const w = Math.max(1, window.innerWidth), hgt = Math.max(1, window.innerHeight)
    if (w === size[0] && hgt === size[1]) return
    size = [w, hgt]
    r.setSize(w, hgt, Math.min(window.devicePixelRatio, 1.5))
  }

  function frame(now) {
    raf = requestAnimationFrame(frame)
    resize()
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    if (!player.dead) step(dt)
    heal(dt)
    attackCooldown = Math.max(0, attackCooldown - dt)
    dayTime = (dayTime + dt / DAY_SECONDS) % 1

    const eye = [player.x, player.y + EYE, player.z]
    camera.position = eye
    camera.yaw = player.yaw
    camera.pitch = player.pitch
    const daylight = updateSky(eye) // { day, night } levels, 0–1
    mobs.update(dt, { player, playerAlive: !player.dead, ...daylight })

    drift = (drift + dt * 0.8) % CLOUD_SPAN
    clouds[0].offset[0] = drift
    clouds[1].offset[0] = drift - CLOUD_SPAN
    if (!frozen) {
      water.uvTransform[2] = (water.uvTransform[2] + dt * 0.03) % 1
      water.uvTransform[3] = (water.uvTransform[3] + dt * 0.015) % 1
    }

    const t = raycast()
    target = t?.hit ?? null
    if (target) outline.offset = target
    if (itemsDirty) collectItems()
    view.items = [...before, ...mobs.items(), ...after, ...(target ? [outline] : [])]
    view.overlay = handOverlay(dt)

    onUnderwater?.(isWater(cell(eye[0]), cell(eye[1]), cell(eye[2])))
    r.render(view, camera)
  }
  raf = requestAnimationFrame(frame)

  return {
    input,
    look(dx, dy) {
      player.yaw -= dx
      player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch - dy))
    },
    select(i) {
      selected = ((i % HOTBAR.length) + HOTBAR.length) % HOTBAR.length
      return selected
    },
    primary,
    placeBlock,
    respawn,
    hotbarIcons: () => HOTBAR.map((n) => (isTool(n) ? sources[n]() : sources[BLOCK_FACES[n][0]]()).toDataURL()),
    dispose() {
      cancelAnimationFrame(raf)
      r.dispose()
    },
  }
}

// ---------- Geometry helpers ----------

const norm = (v) => {
  const l = Math.hypot(...v)
  return v.map((c) => c / l)
}

// Square facing the viewer, `dist` away along `dir`
function billboard(eye, dir, dist, size) {
  const c = eye.map((e, i) => e + dir[i] * dist)
  let right = norm([-dir[2], 0, dir[0]])
  if (!isFinite(right[0])) right = [1, 0, 0]
  const up = [dir[1] * right[2] - dir[2] * right[1], dir[2] * right[0] - dir[0] * right[2], dir[0] * right[1] - dir[1] * right[0]]
  const hs = size / 2
  const corner = (a, b) => c.map((v, i) => v + right[i] * a * hs + up[i] * b * hs)
  return new Float32Array([...corner(-1, -1), ...corner(1, -1), ...corner(1, 1), ...corner(-1, 1)])
}

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

// Small square stars scattered over the sky, around the origin (moved to the eye each frame)
function starField(count) {
  const pos = [], idx = []
  let seed = 9
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, e = Math.asin(0.05 + rand() * 0.95) // above the horizon
    const dir = [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)]
    const quad = billboard([0, 0, 0], dir, 120, 0.35 + rand() * 0.35)
    const start = pos.length / 3
    pos.push(...quad)
    idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }
  return { pos: new Float32Array(pos), idx: new Uint32Array(idx) }
}

// The 12 edges of a block, slightly oversized so they sit on top of its faces
function cubeEdges() {
  const s = 0.502
  const pos = []
  for (const x of [-s, s]) for (const y of [-s, s]) for (const z of [-s, s]) pos.push(x, y, z)
  const idx = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7]
  return { pos: new Float32Array(pos), idx: new Uint32Array(idx) }
}

