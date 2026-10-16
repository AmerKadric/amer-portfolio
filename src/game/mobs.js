// Animals that wander the game world: pick a direction, amble for a while,
// stop to graze, repeat. They climb single blocks, avoid water and cliff edges,
// and their legs swing as they walk.

import { MOBS, FACES, FACE_DATA, toLinear } from '../lib/worldgen'
import { rng } from '../lib/textures'

const WALK_SPEED = 1.1
const TURN_SPEED = 3 // radians per second
const COUNT = 12

// ---------- Tiny matrix helpers (column-major 4×4) ----------
const mul = (a, b) => {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
    }
  }
  return o
}
const translate = (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1])
const rotateY = (a) => {
  const c = Math.cos(a), s = Math.sin(a)
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1])
}
const rotateX = (a) => {
  const c = Math.cos(a), s = Math.sin(a)
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1])
}

// One box (a body part) as a mesh, in the animal's own coordinates (feet at y = 0, facing +z)
function partMesh(part, light) {
  const buffers = {}
  for (let f = 0; f < 6; f++) {
    const tex = part.faces[f]
    const b = (buffers[tex] ??= { pos: [], uv: [], col: [], idx: [] })
    const v = toLinear(FACES[f].shade * light)
    const start = b.pos.length / 3
    for (const { p, uv } of FACE_DATA[f].corners) {
      for (let a = 0; a < 3; a++) b.pos.push((part.min[a] + p[a] * (part.max[a] - part.min[a])) / 16)
      b.uv.push(uv[0], uv[1])
      b.col.push(v, v, v)
    }
    b.idx.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }
  return buffers
}

export function createMobs({ renderer, plan, light, itemFor, blocks, nameAt, isWater, inCircle }) {
  const kinds = plan.biome.animals?.kinds
  if (!kinds) return { items: [], update() {} }

  // Build each animal type's parts once; every animal of that type reuses them
  const models = {}
  for (const type of Object.keys(kinds)) {
    models[type] = MOBS[type].map((part) => {
      const isLeg = part.min[1] === 0 // legs stand on the ground; everything else is rigid
      const meshes = Object.entries(partMesh(part, light)).map(([tex, b]) =>
        itemFor(tex, renderer.mesh({
          pos: new Float32Array(b.pos), uv: new Float32Array(b.uv), col: new Float32Array(b.col), idx: new Uint32Array(b.idx),
        })),
      )
      // Legs swing around the hip: the top-centre of the leg
      const pivot = [(part.min[0] + part.max[0]) / 32, part.max[1] / 16, (part.min[2] + part.max[2]) / 32]
      return { meshes, isLeg, pivot, front: part.min[2] >= 0, left: part.min[0] < 0 }
    })
  }

  // Ground height under a spot: the top of the highest solid block at or just below `y`
  const groundAt = (x, z, y) => {
    const bx = Math.round(x), bz = Math.round(z)
    for (let by = Math.round(y) + 1; by > Math.round(y) - 4; by--) {
      if (blocks(bx, by, bz)) return by + 0.5
    }
    return null // a drop of more than a few blocks
  }

  // Place animals: the panorama's grazers plus more scattered on grass
  const r = rng(2024)
  const pick = () => {
    let roll = r()
    for (const [k, share] of Object.entries(kinds)) if ((roll -= share) <= 0) return k
    return Object.keys(kinds)[0]
  }
  const spots = plan.mobs.map(([type, x, top, z, turn]) => [type, x, top, z, turn])
  for (let tries = 0; tries < 2000 && spots.length < COUNT; tries++) {
    const a = r() * Math.PI * 2, d = 8 + r() * (plan.HALF - 14)
    const x = Math.round(Math.cos(a) * d), z = Math.round(Math.sin(a) * d)
    if (!inCircle(x, z)) continue
    const top = plan.h(x, z)
    if (top <= plan.sea + 1 || nameAt(x, top, z) !== 'grass' || nameAt(x, top + 1, z) !== 'air') continue
    spots.push([pick(), x, top, z, Math.floor(r() * 4)])
  }

  const mobs = spots.map(([type, x, top, z, turn]) => ({
    type, x, z, y: top + 0.5, vy: 0,
    yaw: turn * (Math.PI / 2), targetYaw: turn * (Math.PI / 2),
    walking: false, timer: 1 + r() * 4, phase: r() * 10, swing: 0,
    parts: models[type].map((p) => ({ ...p, meshes: p.meshes.map((m) => ({ ...m, model: new Float32Array(16) })) })),
  }))

  const items = mobs.flatMap((m) => m.parts.flatMap((p) => p.meshes))

  function blockedAt(m, x, z) {
    if (!inCircle(Math.round(x), Math.round(z))) return true
    const ground = groundAt(x, z, m.y)
    if (ground === null) return true // cliff edge
    if (ground - m.y > 1.01) return true // more than one block up
    if (isWater(Math.round(x), Math.round(ground + 0.5), Math.round(z)) || isWater(Math.round(x), Math.round(ground - 0.5), Math.round(z))) return true
    // Body must fit: nothing solid at body height above the new ground
    const by = Math.round(Math.max(ground, m.y) + 0.5)
    return blocks(Math.round(x), by, Math.round(z))
  }

  function update(dt) {
    for (const m of mobs) {
      // Decide what to do next
      m.timer -= dt
      if (m.timer <= 0) {
        m.walking = !m.walking && r() < 0.75
        m.timer = m.walking ? 2 + r() * 4 : 1.5 + r() * 5
        if (m.walking) m.targetYaw = m.yaw + (r() - 0.5) * Math.PI * 1.6
      }

      // Turn smoothly toward where it's heading
      let diff = m.targetYaw - m.yaw
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      m.yaw += Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED * dt)

      // Walk forward (+z in its own space) unless something's in the way
      if (m.walking && Math.abs(diff) < 0.6) {
        const nx = m.x + Math.sin(m.yaw) * WALK_SPEED * dt
        const nz = m.z + Math.cos(m.yaw) * WALK_SPEED * dt
        if (blockedAt(m, nx, nz)) {
          m.targetYaw = m.yaw + Math.PI * (0.5 + r()) // turn away
        } else {
          m.x = nx
          m.z = nz
        }
      }

      // Settle onto the ground: hop up steps, fall down small drops
      const ground = groundAt(m.x, m.z, m.y) ?? m.y
      if (ground > m.y) m.y = Math.min(ground, m.y + 6 * dt)
      else {
        m.vy -= 20 * dt
        m.y = Math.max(ground, m.y + m.vy * dt)
        if (m.y === ground) m.vy = 0
      }

      // Legs swing while walking, and ease back to standing when stopped
      const moving = m.walking && Math.abs(diff) < 0.6
      m.swing += ((moving ? 1 : 0) - m.swing) * Math.min(1, dt * 6)
      m.phase += dt * 7
      const base = mul(translate(m.x, m.y, m.z), rotateY(m.yaw))
      for (const p of m.parts) {
        let model = base
        if (p.isLeg) {
          // Diagonal pairs move together, like a real four-legged walk
          const angle = Math.sin(m.phase + (p.front === p.left ? 0 : Math.PI)) * 0.6 * m.swing
          const [px, py, pz] = p.pivot
          model = mul(base, mul(translate(px, py, pz), mul(rotateX(angle), translate(-px, -py, -pz))))
        }
        for (const item of p.meshes) item.model.set(model)
      }
    }
  }

  update(0)
  return { items, update }
}
