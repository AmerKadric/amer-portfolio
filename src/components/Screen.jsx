import { go } from '../lib/router'

export function BackButton({ label = 'Back' }) {
  return (
    <button type="button" className="mc-btn" onClick={() => go('')}>
      {label}
    </button>
  )
}

// Shared layout for every sub-menu: title, framed scrollable body, footer buttons.
export default function Screen({ title, children, footer, className = '' }) {
  return (
    <section className={`screen ${className}`} aria-label={title}>
      <h1 className="screen-title">{title}</h1>
      <div className="screen-body">{children}</div>
      <div className="screen-footer">{footer ?? <BackButton />}</div>
    </section>
  )
}

export function Tags({ items }) {
  return (
    <ul className="mc-tags">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}
