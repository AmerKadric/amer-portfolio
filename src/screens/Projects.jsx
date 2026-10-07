import { useMemo, useState } from 'react'
import Screen, { BackButton, Tags } from '../components/Screen'
import { projects } from '../data'

const open = (url) => url && window.open(url, '_blank', 'noopener,noreferrer')

function Signal() {
  return (
    <span className="signal" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  )
}

export default function Projects() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) =>
      [p.title, p.description, ...p.tags].some((s) => s.toLowerCase().includes(q)),
    )
  }, [query])

  const sel = shown.includes(selected) ? selected : null

  const footer = (
    <>
      <button type="button" className="mc-btn" disabled={!sel?.demo} onClick={() => open(sel?.demo)}>Open</button>
      <button type="button" className="mc-btn" disabled={!sel?.github} onClick={() => open(sel?.github)}>GitHub</button>
      <button type="button" className="mc-btn" disabled={!sel} onClick={() => setSelected(null)}>Cancel</button>
      <BackButton />
    </>
  )

  return (
    <Screen title="Select Project" footer={footer} className="footer-4">
      <input
        className="mc-input"
        type="search"
        placeholder="Search projects..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search projects"
      />
      <div className="panel scroll" role="listbox" aria-label="Projects">
        {shown.map((p) => (
          <div
            key={p.title}
            role="option"
            tabIndex={0}
            aria-selected={sel === p}
            className={`entry ${sel === p ? 'selected' : ''}`}
            onClick={() => setSelected(p)}
            onDoubleClick={() => open(p.demo || p.github)}
            onKeyDown={(e) => e.key === 'Enter' && setSelected(p)}
          >
            <div className="entry-icon" style={{ backgroundColor: p.color }}>{p.icon}</div>
            <div className="entry-main">
              <h2>
                {p.title} <span className="dim">{p.year}</span>
              </h2>
              <p>{p.description}</p>
              <Tags items={p.tags} />
            </div>
            <div className="entry-status">
              <Signal />
              <span>{p.status}</span>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="empty dim">No projects match “{query}”.</p>}
      </div>
      <p className="hint dim">
        {shown.length} project{shown.length === 1 ? '' : 's'} · select a project for actions
      </p>
    </Screen>
  )
}
