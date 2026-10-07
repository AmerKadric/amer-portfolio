import { useEffect, useState } from 'react'
import Screen from '../components/Screen'
import { skills } from '../data'

// Latin → "enchanting table" glyphs, purely decorative
const GLYPHS = {
  a: 'ᔑ', b: 'ʖ', c: 'ᓵ', d: '↸', e: 'ᒷ', f: '⎓', g: '⊣', h: '⍑', i: '╎', j: '⋮', k: 'ꖌ', l: 'ꖎ', m: 'ᒲ',
  n: 'リ', o: 'ᓍ', p: '!', q: 'ᑑ', r: '∷', s: 'ᓭ', t: 'ℸ', u: '⚍', v: '⍊', w: '∴', x: '/', y: '॥', z: 'ᑎ',
}
const POOL = Object.values(GLYPHS)
const toGlyphs = (s) => s.toLowerCase().replace(/[a-z]/g, (c) => GLYPHS[c])
const ROMAN = ['I', 'II', 'III', 'IV', 'V']
const tier = (level) => ROMAN[Math.min(4, Math.max(0, Math.round(level / 20) - 1))]

function useScramble(active) {
  const [text, setText] = useState('ᔑ ⍑ ᓵ ↸ ᒷ ⎓')
  useEffect(() => {
    const shuffle = () =>
      setText(Array.from({ length: 8 }, () => POOL[Math.floor(Math.random() * POOL.length)]).join(' '))
    shuffle()
    const id = setInterval(shuffle, 700)
    return () => clearInterval(id)
  }, [active])
  return text
}

export default function Skills() {
  const [active, setActive] = useState(0)
  const [tip, setTip] = useState(null)
  const scramble = useScramble(active)
  const cat = skills[active]

  const showTip = (e, item) => setTip({ item, x: e.clientX, y: e.clientY })

  return (
    <Screen title="Skills">
      <div className="skills scroll">
        <div className="enchant">
          <div className="enchant-book">
            <h2>Enchant</h2>
            <p className="glyphs">{scramble}</p>
            <div className="particles" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
            </div>
            <p className="dim-dark">Pick a tool to read its enchantments.</p>
          </div>

          <div className="enchant-options">
            {skills.map((c, i) => (
              <button
                key={c.label}
                type="button"
                className={`enchant-row ${i === active ? 'active' : ''}`}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
              >
                <span className="slot"><span className="item" style={{ background: c.color }}>{c.label[0]}</span></span>
                <span className="enchant-text">
                  <span className="glyph-line">{toGlyphs(c.label)}</span>
                  <span className="enchant-name">{c.label}</span>
                  <span className="dim">{c.items.length} enchantments</span>
                </span>
                <span className="enchant-level">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel warm applied">
          <div className="section-head">
            <h2>{cat.label}</h2>
            <span className="dim">{cat.items.length} applied</span>
          </div>
          <div className="applied-grid">
            {cat.items.map((s) => (
              <div
                key={s.name}
                className="applied-item"
                tabIndex={0}
                onMouseMove={(e) => showTip(e, s)}
                onMouseLeave={() => setTip(null)}
                onFocus={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setTip({ item: s, x: r.left + 20, y: r.bottom + 30 })
                }}
                onBlur={() => setTip(null)}
              >
                <span className="slot"><span className="item" style={{ background: cat.color }}>{s.abbr}</span></span>
                <span>{s.name}</span>
                <span className="tier">{tier(s.level)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tip && (
        <div
          className="mc-tooltip"
          style={{ left: Math.min(tip.x + 14, window.innerWidth - 260), top: tip.y - 30 }}
          role="tooltip"
        >
          <div className="tt-name">{tip.item.name}</div>
          <div className="tt-ench">Proficiency {tier(tip.item.level)}</div>
          <div className="tt-dim">{tip.item.level}/100</div>
        </div>
      )}
    </Screen>
  )
}
