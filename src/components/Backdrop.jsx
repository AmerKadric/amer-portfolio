import { PLACEHOLDERS } from '../lib/placeholders'

// A tiny, heavily blurred snapshot of the chosen scene, shown instantly while
// the live 3D world loads, then faded out underneath it
export default function Backdrop({ scene, hidden }) {
  const src = PLACEHOLDERS[`${scene.biome}-${scene.time}`]
  return (
    <div
      className={`backdrop${hidden ? ' hidden' : ''}`}
      style={src ? { backgroundImage: `url(${src})` } : undefined}
      aria-hidden="true"
    />
  )
}
