// Creatures in the game world.
// Animals wander, graze, and run away when hit. Zombies come out at night,
// chase and attack the player, and burn up at sunrise. Everything can be hit,
// gets knocked back, flashes red, and falls over when it dies.

import { MOBS, FACES, FACE_DATA, toLinear } from '../lib/worldgen'
import { rng } from '../lib/textures'
import { chain, translate, rotateX, rotateY, rotateZ } from '../lib/mat4'

const TYPES = {
  sheep: { hp: 8, speed: 1.1, width: 0.9, height: 1.3 },
  cow: { hp: 10, speed: 1.0, width: 0.9, height: 1.5 },
  pig: { hp: 10, speed: 1.1, width: 0.9, height: 1.0 },
  zombie: { hp: 20, speed: 2.3, width: 0.6, height: 2.0, hostile: true, damage: 3 },
}
const TURN_SPEED = 3.5 // radians per second
const ANIMALS = 12
const MAX_ZOMBIES = 6
const CHASE_RANGE = 32
const CHASE_HEIGHT = 12 // notices you this far above or below
const ATTACK_RANGE = 1.15
const HURT_FLASH = 0.35
const RED = [1, 0.35, 0.35]

// One box (a body part) as a mesh, in the creature's own space (feet at y = 0, facing +z)
function partBuffers(part, light) {
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

export function createMobs({ renderer, plan, light, itemFor, blocks, nameAt, isWater, inCircle, onAttackPlayer }) {
  const r = rng(2024)
  const kinds = plan.biome.animals?.kinds ?? {}

  // Build each type's parts once; every creature of that type reuses the GPU meshes
  const models = {}
  const modelFor = (type) =>
    (models[type] ??= MOBS[type].map((part) => {
      const meshes = Object.entries(partBuffers(part, light)).map(([tex, b]) =>
        itemFor(tex, renderer.mesh({
          pos: new Float32Array(b.pos), uv: new Float32Array(b.uv), col: new Float32Array(b.col), idx: new Uint32Array(b.idx),
        })),
      )
      return {
        meshes,
        isLeg: part.min[1] === 0, // legs stand on the ground; everything else is rigid
        pivot: [(part.min[0] + part.max[0]) / 32, part.max[1] / 16, (part.min[2] + part.max[2]) / 32], // the hip
        front: part.min[2] >= 0,
        left: part.min[0] < 0,
      }
    }))

  // Ground under a spot: the top of the highest solid block at or a little below `y`
  const groundAt = (x, z, y) => {
    const bx = Math.round(x), bz = Math.round(z)
    for (let by = Math.round(y) + 1; by > Math.round(y) - 4; by--) if (blocks(bx, by, bz)) return by + 0.5
    return null // a drop of more than a few blocks
  }

  const mobs = []
  let spawnTimer = 0

  function spawn(type, x, y, z, yaw) {
    const t = TYPES[type]
    const m = {
      type, ...t, x, y, z, yaw, targetYaw: yaw, vy: 0, kx: 0, kz: 0,
      health: t.hp, hurt: 0, dead: 0, flee: 0, attackCooldown: 0, burn: 0, detour: 0, detourYaw: 0,
      walking: false, timer: 1 + r() * 4, phase: r() * 10, swing: 0,
      parts: modelFor(type).map((p) => ({ ...p, meshes: p.meshes.map((it) => ({ ...it, model: new Float32Array(16) })) })),
    }
    mobs.push(m)
    pose(m)
    return m
  }

  // Place each body part for drawing
  function pose(m) {
    let base = chain(translate(m.x, m.y, m.z), rotateY(m.yaw))
    if (m.dead) base = chain(base, rotateZ(Math.min(1, m.dead / 0.4) * (Math.PI / 2) * 0.95)) // topple over
    const tint = m.hurt > 0 || m.dead ? RED : undefined
    for (const p of m.parts) {
      let model = base
      if (p.isLeg && !m.dead) {
        // Diagonal pairs move together, like a real walk
        const angle = Math.sin(m.phase + (p.front === p.left ? 0 : Math.PI)) * 0.6 * m.swing
        const [px, py, pz] = p.pivot
        model = chain(base, translate(px, py, pz), rotateX(angle), translate(-px, -py, -pz))
      }
      for (const item of p.meshes) {
        item.model.set(model)
        item.tint = tint
      }
    }
  }

  // Animals: the panorama's grazers plus more scattered on grass
  const pickKind = () => {
    let roll = r()
    for (const [k, share] of Object.entries(kinds)) if ((roll -= share) <= 0) return k
    return Object.keys(kinds)[0]
  }
  if (Object.keys(kinds).length) {
    const spots = plan.mobs.map(([type, x, top, z, turn]) => [type, x, top, z, turn])
    for (let tries = 0; tries < 2000 && spots.length < ANIMALS; tries++) {
      const a = r() * Math.PI * 2, d = 8 + r() * (plan.HALF - 14)
      const x = Math.round(Math.cos(a) * d), z = Math.round(Math.sin(a) * d)
      if (!inCircle(x, z)) continue
      const top = plan.h(x, z)
      if (top <= plan.sea + 1 || nameAt(x, top, z) !== 'grass' || nameAt(x, top + 1, z) !== 'air') continue
      spots.push([pickKind(), x, top, z, Math.floor(r() * 4)])
    }
    for (const [type, x, top, z, turn] of spots) spawn(type, x, top + 0.5, z, turn * (Math.PI / 2))
  }

  function blockedAt(m, x, z) {
    const bx = Math.round(x), bz = Math.round(z)
    if (!inCircle(bx, bz)) return true
    const ground = groundAt(x, z, m.y)
    if (ground === null) return true // cliff edge
    if (ground - m.y > 1.01) return true // more than one block up
    if (isWater(bx, Math.round(ground + 0.5), bz) || isWater(bx, Math.round(ground - 0.5), bz)) return true
    const by = Math.round(Math.max(ground, m.y) + 0.5)
    return blocks(bx, by, bz) || (m.height > 1.6 && blocks(bx, by + 1, bz)) // body (and head, for tall ones) must fit
  }

  function damage(m, amount, fromX, fromZ, knock = 7) {
    if (m.dead) return
    m.health -= amount
    m.hurt = HURT_FLASH
    const dx = m.x - fromX, dz = m.z - fromZ, d = Math.hypot(dx, dz) || 1
    m.kx = (dx / d) * knock
    m.kz = (dz / d) * knock
    if (!m.hostile) {
      m.flee = 3
      m.targetYaw = Math.atan2(dx, dz) // run away from the hit
    }
    if (m.health <= 0) m.dead = 0.001
  }

  function update(dt, { player, playerAlive, night, day }) {
    for (let i = mobs.length - 1; i >= 0; i--) {
      const m = mobs[i]
      m.hurt = Math.max(0, m.hurt - dt)
      m.attackCooldown = Math.max(0, m.attackCooldown - dt)

      if (m.dead) {
        m.dead += dt
        if (m.dead > 0.9) mobs.splice(i, 1) // gone
        else pose(m)
        continue
      }

      // Zombies burn up in daylight
      if (m.hostile && day > 0.7) {
        m.burn += dt
        if (m.burn > 0.8) {
          m.burn = 0
          damage(m, 2, m.x, m.z, 0)
        }
      }

      const dx = player.x - m.x, dz = player.z - m.z
      const dist = Math.hypot(dx, dz)
      const chasing = m.hostile && playerAlive && dist < CHASE_RANGE && Math.abs(player.y - m.y) < CHASE_HEIGHT
      let speed = m.speed
      if (chasing) {
        m.walking = true
        // Head straight for the player, unless working around something in the way
        m.detour = Math.max(0, m.detour - dt)
        m.targetYaw = m.detour > 0 ? m.detourYaw : Math.atan2(dx, dz)
        if (dist < ATTACK_RANGE && Math.abs(player.y - m.y) < 1.5) {
          m.walking = false
          if (m.attackCooldown === 0) {
            m.attackCooldown = 1
            onAttackPlayer(m.damage, m.x, m.z)
          }
        }
      } else if (m.flee > 0) {
        // Run from whoever hit it
        m.flee -= dt
        m.walking = true
        speed *= 2.2
      } else {
        // Wander: walk for a while, then stop and graze
        m.timer -= dt
        if (m.timer <= 0) {
          m.walking = !m.walking && r() < 0.75
          m.timer = m.walking ? 2 + r() * 4 : 1.5 + r() * 5
          if (m.walking) m.targetYaw = m.yaw + (r() - 0.5) * Math.PI * 1.6
        }
      }

      // Turn smoothly toward where it's heading
      let diff = m.targetYaw - m.yaw
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      m.yaw += Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED * dt)

      // Walk forward unless something's in the way; knockback slides it regardless of facing
      const moving = m.walking && Math.abs(diff) < 0.8
      const stepX = (moving ? Math.sin(m.yaw) * speed : 0) + m.kx
      const stepZ = (moving ? Math.cos(m.yaw) * speed : 0) + m.kz
      if (stepX || stepZ) {
        const nx = m.x + stepX * dt, nz = m.z + stepZ * dt
        if (!blockedAt(m, nx, nz)) {
          m.x = nx
          m.z = nz
        } else if (moving && !chasing) {
          m.targetYaw = m.yaw + Math.PI * (0.5 + r()) // turn away
        } else if (moving && m.detour === 0) {
          // Chasing but blocked: walk off at an angle for a moment to get around it
          m.detour = 1 + r() * 1.5
          m.detourYaw = Math.atan2(dx, dz) + (r() < 0.5 ? 1 : -1) * (Math.PI / 2 + r() * 0.7)
        } else if (moving) {
          m.detourYaw += (r() < 0.5 ? 1 : -1) * Math.PI / 2 // the detour is blocked too: turn again
        }
      }
      const drag = Math.max(0, 1 - dt * 6)
      m.kx *= drag
      m.kz *= drag

      // Settle onto the ground: hop up steps, fall down drops
      const ground = groundAt(m.x, m.z, m.y) ?? m.y - 4
      if (ground > m.y) m.y = Math.min(ground, m.y + 7 * dt)
      else {
        m.vy -= 22 * dt
        m.y = Math.max(ground, m.y + m.vy * dt)
        if (m.y === ground) m.vy = 0
      }
      if (m.y < -10) {
        mobs.splice(i, 1)
        continue
      }

      m.swing += ((moving ? 1 : 0) - m.swing) * Math.min(1, dt * 6)
      m.phase += dt * (m.flee > 0 ? 12 : 7)
      pose(m)
    }

    // Zombies come out at night, somewhere out of sight but not too far away
    const zombies = mobs.filter((m) => m.hostile && !m.dead).length
    spawnTimer -= dt
    if (night > 0.6 && playerAlive && zombies < MAX_ZOMBIES && spawnTimer <= 0) {
      spawnTimer = 2.5 + r() * 3
      for (let tries = 0; tries < 30; tries++) {
        const a = r() * Math.PI * 2, d = 14 + r() * 12
        const x = Math.round(player.x + Math.cos(a) * d), z = Math.round(player.z + Math.sin(a) * d)
        if (!inCircle(x, z)) continue
        const ground = groundAt(x, z, player.y + 8)
        if (ground === null || isWater(x, Math.round(ground + 0.5), z)) continue
        const y = Math.round(ground + 0.5)
        if (blocks(x, y, z) || blocks(x, y + 1, z)) continue
        spawn('zombie', x, ground, z, Math.atan2(player.x - x, player.z - z))
        break
      }
    }
  }

  // Nearest creature hit by a ray (eye position, unit direction), within `reach`
  function raycast(origin, dir, reach) {
    let best = null
    for (const m of mobs) {
      if (m.dead) continue
      const hw = m.width / 2
      const min = [m.x - hw, m.y, m.z - hw], max = [m.x + hw, m.y + m.height, m.z + hw]
      let t0 = 0, t1 = reach, miss = false
      for (let a = 0; a < 3 && !miss; a++) {
        if (Math.abs(dir[a]) < 1e-9) {
          if (origin[a] < min[a] || origin[a] > max[a]) miss = true
          continue
        }
        let ta = (min[a] - origin[a]) / dir[a], tb = (max[a] - origin[a]) / dir[a]
        if (ta > tb) [ta, tb] = [tb, ta]
        t0 = Math.max(t0, ta)
        t1 = Math.min(t1, tb)
        if (t0 > t1) miss = true
      }
      if (!miss && (!best || t0 < best.distance)) best = { mob: m, distance: t0 }
    }
    return best
  }

  return {
    update,
    damage,
    raycast,
    items: () => mobs.flatMap((m) => m.parts.flatMap((p) => p.meshes)),
    count: (hostile) => mobs.filter((m) => !m.dead && !!m.hostile === hostile).length,
    clearHostiles() {
      for (let i = mobs.length - 1; i >= 0; i--) if (mobs[i].hostile) mobs.splice(i, 1)
    },
  }
}
