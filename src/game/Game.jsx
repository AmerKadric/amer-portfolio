import { useEffect, useRef, useState } from 'react'
import { createGame, HOTBAR } from './engine'
import { playClick } from '../lib/sound'

// The hidden game's screen: canvas, crosshair, hotbar, pause menu, and either
// mouse + keyboard or touch controls.

const isTouch = () =>
  typeof window !== 'undefined' && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)

const KEYS = {
  KeyW: ['forward', 1], ArrowUp: ['forward', 1], KeyS: ['forward', -1], ArrowDown: ['forward', -1],
  KeyD: ['strafe', 1], ArrowRight: ['strafe', 1], KeyA: ['strafe', -1], ArrowLeft: ['strafe', -1],
}
// Physical key code, falling back to the typed character when a device doesn't report one
const codeOf = (e) => {
  if (e.code) return e.code
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
  if (/^[a-z]$/.test(k)) return `Key${k.toUpperCase()}`
  if (/^[0-9]$/.test(k)) return `Digit${k}`
  return { ' ': 'Space', Shift: 'ShiftLeft', Control: 'ControlLeft' }[k] ?? k
}

const LABELS = { grass: 'Grass', dirt: 'Dirt', stone: 'Stone', cobble: 'Cobblestone', planks: 'Planks', log: 'Log', glass: 'Glass', sand: 'Sand', bricks: 'Bricks' }

export default function Game({ scene, onExit }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [touch] = useState(isTouch)
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(!touch) // desktop starts on "click to play"
  const [selected, setSelected] = useState(0)
  const [icons, setIcons] = useState([])
  const [underwater, setUnderwater] = useState(false)
  const [failed, setFailed] = useState(false)

  // Start the game (after a frame, so the loading screen shows first)
  useEffect(() => {
    let game = null
    let wet = false
    const timer = setTimeout(() => {
      game = createGame(canvasRef.current, { biomeId: scene.biome, time: scene.time }, {
        onUnderwater: (w) => {
          if (w !== wet) setUnderwater((wet = w))
        },
      })
      if (!game) {
        setFailed(true)
        return
      }
      game.input.autoJump = touch
      gameRef.current = game
      setIcons(game.hotbarIcons())
      setLoading(false)
    }, 30)
    return () => {
      clearTimeout(timer)
      game?.dispose()
      gameRef.current = null
    }
  }, [scene.biome, scene.time, touch])

  const select = (i) => setSelected(gameRef.current?.select(i) ?? i)
  // If the browser refuses to capture the mouse, play anyway: move the mouse to look
  const freeMouse = useRef(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  // ---------- Desktop: mouse look (pointer lock) + keyboard ----------
  useEffect(() => {
    if (touch) return
    const canvas = canvasRef.current
    const held = new Set()
    let breakTimer = null, placeTimer = null
    const active = () => document.pointerLockElement === canvas || (freeMouse.current && !pausedRef.current)
    const stopAll = () => {
      held.clear()
      updateMove()
      clearInterval(breakTimer)
      clearInterval(placeTimer)
    }

    const updateMove = () => {
      const g = gameRef.current
      if (!g) return
      g.input.forward = 0
      g.input.strafe = 0
      for (const code of held) {
        const k = KEYS[code]
        if (k) g.input[k[0]] += k[1]
      }
      g.input.jump = held.has('Space')
      g.input.sprint = held.has('ShiftLeft') || held.has('ShiftRight') || held.has('ControlLeft')
    }
    const onKeyDown = (e) => {
      if (freeMouse.current && e.code === 'Escape') {
        setPaused(true)
        stopAll()
        return
      }
      if (!active()) return
      const code = codeOf(e)
      if (/^Digit[1-9]$/.test(code)) select(Number(code.slice(5)) - 1)
      if (KEYS[code] || code === 'Space') e.preventDefault()
      held.add(code)
      updateMove()
    }
    const onKeyUp = (e) => {
      held.delete(codeOf(e))
      updateMove()
    }
    const onMouseMove = (e) => {
      if (active()) gameRef.current?.look(e.movementX * 0.0025, e.movementY * 0.0025)
    }
    // Hold a mouse button to keep breaking / placing, like the game
    const repeat = (fn) => {
      fn()
      return setInterval(fn, 250)
    }
    const onMouseDown = (e) => {
      if (!active() || e.target !== canvas) return
      if (e.button === 0) breakTimer = repeat(() => gameRef.current?.breakBlock())
      if (e.button === 2) placeTimer = repeat(() => gameRef.current?.placeBlock())
    }
    const onMouseUp = (e) => {
      if (e.button === 0) clearInterval(breakTimer)
      if (e.button === 2) clearInterval(placeTimer)
    }
    const onWheel = (e) => {
      if (active()) setSelected((s) => gameRef.current?.select(s + Math.sign(e.deltaY)) ?? s)
    }
    const onLockChange = () => {
      const locked = document.pointerLockElement === canvas
      if (freeMouse.current) return
      setPaused(!locked)
      if (!locked) stopAll()
    }
    const noMenu = (e) => e.preventDefault()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('wheel', onWheel)
    document.addEventListener('pointerlockchange', onLockChange)
    canvas.addEventListener('contextmenu', noMenu)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('wheel', onWheel)
      document.removeEventListener('pointerlockchange', onLockChange)
      canvas.removeEventListener('contextmenu', noMenu)
      clearInterval(breakTimer)
      clearInterval(placeTimer)
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    }
  }, [touch])

  const resume = () => {
    playClick()
    if (touch || freeMouse.current) {
      setPaused(false)
      return
    }
    const fallback = () => {
      freeMouse.current = true
      setPaused(false)
    }
    try {
      const request = canvasRef.current?.requestPointerLock?.()
      if (request?.catch) request.catch(fallback)
      else if (!canvasRef.current?.requestPointerLock) fallback()
    } catch {
      fallback()
    }
  }
  const exit = () => {
    playClick()
    if (document.pointerLockElement) document.exitPointerLock()
    onExit()
  }

  // ---------- Touch: joystick (left), drag to look (right), buttons ----------
  const stick = useRef(null)
  const [knob, setKnob] = useState([0, 0])
  const lookTouch = useRef(null)

  const stickStart = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    stick.current = { id: e.pointerId, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 }
    stickMove(e)
  }
  const stickMove = (e) => {
    const s = stick.current
    if (!s || s.id !== e.pointerId) return
    let dx = e.clientX - s.cx, dy = e.clientY - s.cy
    const max = 44, len = Math.hypot(dx, dy)
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max }
    setKnob([dx, dy])
    const g = gameRef.current
    if (g) {
      g.input.strafe = dx / max
      g.input.forward = -dy / max
      g.input.sprint = len > max * 1.4
    }
  }
  const stickEnd = (e) => {
    if (stick.current?.id !== e.pointerId) return
    stick.current = null
    setKnob([0, 0])
    const g = gameRef.current
    if (g) g.input.forward = g.input.strafe = 0
  }
  const lookStart = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    lookTouch.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const lookMove = (e) => {
    const l = lookTouch.current
    if (!l || l.id !== e.pointerId) return
    gameRef.current?.look((e.clientX - l.x) * 0.006, (e.clientY - l.y) * 0.006)
    l.x = e.clientX
    l.y = e.clientY
  }
  const lookEnd = (e) => {
    if (lookTouch.current?.id === e.pointerId) lookTouch.current = null
  }
  const hold = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault()
      if (gameRef.current) gameRef.current.input[key] = true
    },
    onPointerUp: () => gameRef.current && (gameRef.current.input[key] = false),
    onPointerCancel: () => gameRef.current && (gameRef.current.input[key] = false),
    onPointerLeave: () => gameRef.current && (gameRef.current.input[key] = false),
  })
  // Hold Break / Place to repeat; timers live in a ref so re-renders can't lose them
  const repeatTimers = useRef({})
  const tapRepeat = (action) => {
    const stop = () => clearInterval(repeatTimers.current[action])
    return {
      onPointerDown: (e) => {
        e.preventDefault()
        stop()
        gameRef.current?.[action]()
        repeatTimers.current[action] = setInterval(() => gameRef.current?.[action](), 300)
      },
      onPointerUp: stop,
      onPointerCancel: stop,
      onPointerLeave: stop,
    }
  }
  useEffect(() => () => Object.values(repeatTimers.current).forEach(clearInterval), [])

  return (
    <div className={`game${touch ? ' touch' : ''}`}>
      <canvas ref={canvasRef} className="game-canvas" onClick={() => !touch && paused && resume()} />
      {underwater && <div className="game-underwater" />}

      {!loading && !failed && (
        <>
          <div className="game-crosshair" aria-hidden="true" />
          <div className="game-hotbar" role="toolbar" aria-label="Blocks">
            {HOTBAR.map((name, i) => (
              <button
                key={name}
                type="button"
                className={`game-slot${i === selected ? ' selected' : ''}`}
                onClick={() => select(i)}
                title={`${i + 1}. ${LABELS[name]}`}
                aria-label={LABELS[name]}
                aria-pressed={i === selected}
              >
                {icons[i] && <img src={icons[i]} alt="" />}
              </button>
            ))}
          </div>
          <div className="game-label">{LABELS[HOTBAR[selected]]}</div>
        </>
      )}

      {touch && !loading && !failed && !paused && (
        <>
          <div className="game-look" onPointerDown={lookStart} onPointerMove={lookMove} onPointerUp={lookEnd} onPointerCancel={lookEnd} />
          <div className="game-stick" onPointerDown={stickStart} onPointerMove={stickMove} onPointerUp={stickEnd} onPointerCancel={stickEnd}>
            <div className="game-knob" style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
          </div>
          <div className="game-buttons">
            <button type="button" className="mc-btn game-btn" {...tapRepeat('breakBlock')} aria-label="Break block">Break</button>
            <button type="button" className="mc-btn game-btn" {...tapRepeat('placeBlock')} aria-label="Place block">Place</button>
            <button type="button" className="mc-btn game-btn jump" {...hold('jump')} aria-label="Jump">Jump</button>
          </div>
          <button type="button" className="mc-btn small game-pause" onClick={() => setPaused(true)} aria-label="Pause">II</button>
        </>
      )}

      {(loading || failed) && (
        <div className="game-overlay">
          <h1>{failed ? 'Your browser can’t run the game' : 'Generating world…'}</h1>
          {failed && <button type="button" className="mc-btn" onClick={exit}>Back to Portfolio</button>}
        </div>
      )}

      {!loading && !failed && paused && (
        <div className="game-overlay">
          <h1>Game Menu</h1>
          <button type="button" className="mc-btn" onClick={resume}>{touch ? 'Back to Game' : 'Click to Play'}</button>
          <button type="button" className="mc-btn" onClick={exit}>Back to Portfolio</button>
          <ul className="game-help">
            {touch ? (
              <>
                <li>Left stick: walk (push far to sprint)</li>
                <li>Drag the right side: look around</li>
                <li>Break / Place / Jump buttons</li>
                <li>Tap the hotbar to choose a block</li>
              </>
            ) : (
              <>
                <li>Mouse: look · WASD: move · Space: jump · Shift: sprint</li>
                <li>Left click: break · Right click: place</li>
                <li>1–9 or scroll: choose a block · Esc: pause</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
